import random
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from app.db.session import get_db
from app.db.models import Report as DBReport, Classification as DBClassification
from app.schemas.enums import RiskLevelEnum
from app.schemas.report import ReportCreate
from app.schemas.classification import (
    ClassifyReportResponse,
    ReportWithClassificationResponse,
    ClassificationResultResponse,
    ClassificationUpdate,
    NormQueryResultResponse,
)
from app.services.rag_service import rag_engine
from app.services.ml_service import ml_service
from app.services.document_service import process_document

router = APIRouter()

def format_iso(dt) -> str:
    if not dt:
        return datetime.utcnow().isoformat() + "Z"
    s = dt.isoformat()
    if s.endswith("+00:00"):
        s = s[:-6] + "Z"
    elif not s.endswith("Z") and "+" not in s:
        s = s + "Z"
    return s


def build_report_response(db_report: DBReport) -> ReportWithClassificationResponse:
    cls = db_report.classification
    risk_enum = RiskLevelEnum.BAIXO
    if cls.risk_level == "Crítico":
        risk_enum = RiskLevelEnum.CRITICO
    elif cls.risk_level == "Médio":
        risk_enum = RiskLevelEnum.MEDIO

    classification_resp = ClassificationResultResponse(
        id=cls.id,
        reportId=cls.report_id,
        category=cls.category,
        riskLevel=risk_enum,
        confidence=cls.confidence,
        translatedText=cls.translated_text,
        xaiExplanation=cls.xai_explanation or "",
        xaiHighlightedTerms=cls.xai_highlighted_terms or [],
        xaiJustification=cls.xai_justification or "",
        isManualOverride=cls.is_manual_override or False,
        correctionReason=cls.correction_reason,
        createdAt=format_iso(cls.created_at),
    )

    return ReportWithClassificationResponse(
        id=db_report.id,
        text=db_report.text,
        sector=db_report.sector or "Operacional",
        createdAt=format_iso(db_report.created_at),
        classification=classification_resp,
    )


import uuid

def generate_unique_report_id(db: Session) -> str:
    for _ in range(50):
        candidate = f"RL-{random.randint(10000, 99999)}"
        if not db.query(DBReport).filter(DBReport.id == candidate).first():
            return candidate
    return f"RL-{uuid.uuid4().hex[:6].upper()}"


@router.post("/classify", response_model=ClassifyReportResponse, status_code=status.HTTP_201_CREATED)
async def classify_report(payload: ReportCreate, db: Session = Depends(get_db)):
    """Submete um relato em texto para classificação automática por IA e salva no PostgreSQL."""
    generated_id = generate_unique_report_id(db)

    # 1. Classificação via ML Service
    ml_result = ml_service.predict_risk(payload.text)

    # 2. Salva no Banco PostgreSQL
    db_report = DBReport(
        id=generated_id,
        text=payload.text,
        sector=payload.sector or "Operacional",
    )
    db_classification = DBClassification(
        id=generated_id,
        report_id=generated_id,
        category=ml_result["category"],
        risk_level=ml_result["riskLevel"],
        confidence=ml_result["confidence"],
        translated_text=ml_result.get("translatedText"),
        xai_explanation=ml_result["xaiExplanation"],
        xai_highlighted_terms=ml_result["xaiHighlightedTerms"],
        xai_justification=ml_result["xaiJustification"],
    )

    db.add(db_report)
    db.add(db_classification)
    db.commit()
    db.refresh(db_report)

    resp = build_report_response(db_report)
    return ClassifyReportResponse(
        report={
            "id": resp.id,
            "text": resp.text,
            "sector": resp.sector,
            "createdAt": resp.createdAt,
        },
        classification=resp.classification,
    )


@router.post("/classify-document", response_model=ClassifyReportResponse, status_code=status.HTTP_201_CREATED)
async def classify_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Submete um ARQUIVO para extração completa pelo backend e salva no PostgreSQL."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")

    # 1. Processamento completo do documento no backend
    doc_result = process_document(file.filename, file_bytes)

    if not doc_result["success"]:
        raise HTTPException(status_code=422, detail=doc_result.get("error", "Erro ao processar documento."))

    classification_input = doc_result["classificationInput"]
    generated_id = generate_unique_report_id(db)

    # 2. Classificação ML
    ml_result = ml_service.predict_risk(classification_input)
    xai_terms = doc_result["rawMatches"][:5] if doc_result["rawMatches"] else ml_result["xaiHighlightedTerms"]

    # 3. Salva no Banco PostgreSQL
    original_text_summary = doc_result["fullText"][:300] + ("..." if len(doc_result["fullText"]) > 300 else "")

    db_report = DBReport(
        id=generated_id,
        text=original_text_summary,
        sector="Operacional",
    )
    db_classification = DBClassification(
        id=generated_id,
        report_id=generated_id,
        category=ml_result["category"],
        risk_level=ml_result["riskLevel"],
        confidence=ml_result["confidence"],
        translated_text=ml_result.get("translatedText"),
        xai_explanation=ml_result["xaiExplanation"],
        xai_highlighted_terms=xai_terms,
        xai_justification=ml_result["xaiJustification"],
    )

    db.add(db_report)
    db.add(db_classification)
    db.commit()
    db.refresh(db_report)

    resp = build_report_response(db_report)
    return ClassifyReportResponse(
        report={
            "id": resp.id,
            "text": resp.text,
            "sector": resp.sector,
            "createdAt": resp.createdAt,
        },
        classification=resp.classification,
    )


@router.get("", response_model=list[ReportWithClassificationResponse])
async def list_reports(
    db: Session = Depends(get_db),
    order_column: str = Query('created_at'),
    order_dir: str = Query('desc')
):
    """Retorna a listagem dos relatos classificados salvos no PostgreSQL com ordenação server-side."""
    query = db.query(DBReport)

    if order_column in ['risk_level', 'category']:
        query = query.join(DBClassification)

    if order_column == 'sector':
        sort_col = DBReport.sector
    elif order_column == 'risk_level':
        sort_col = case(
            (DBClassification.risk_level == 'Crítico', 3),
            (DBClassification.risk_level == 'Médio', 2),
            (DBClassification.risk_level == 'Baixo', 1),
            else_=0,
        )
    elif order_column == 'category':
        sort_col = DBClassification.category
    else:
        sort_col = DBReport.created_at

    if order_dir == 'asc':
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    db_reports = query.all()
    return [build_report_response(r) for r in db_reports if r.classification]


@router.get("/{report_id}", response_model=ReportWithClassificationResponse)
async def get_report(report_id: str, db: Session = Depends(get_db)):
    """Retorna um relato específico pelo ID salvo no PostgreSQL."""
    db_report = db.query(DBReport).filter(DBReport.id == report_id).first()
    if not db_report or not db_report.classification:
        raise HTTPException(status_code=404, detail=f"Relato '{report_id}' não encontrado no banco.")
    return build_report_response(db_report)


@router.patch("/classification/{report_id}", response_model=ReportWithClassificationResponse)
async def update_classification(report_id: str, payload: ClassificationUpdate, db: Session = Depends(get_db)):
    """Atualização manual do nível de risco salva no PostgreSQL."""
    db_report = db.query(DBReport).filter(DBReport.id == report_id).first()
    if not db_report or not db_report.classification:
        raise HTTPException(status_code=404, detail="Relato não encontrado.")

    db_report.classification.category = payload.category
    db_report.classification.risk_level = payload.riskLevel.value
    db_report.classification.is_manual_override = True
    if payload.correctionReason:
        db_report.classification.correction_reason = payload.correctionReason

    db.commit()
    db.refresh(db_report)
    return build_report_response(db_report)


@router.post("/{report_id}/query-norm", response_model=NormQueryResultResponse)
async def query_norm_for_report(report_id: str, db: Session = Depends(get_db)):
    """Consulta RAG das diretrizes normativas (NR) para um relato do PostgreSQL."""
    db_report = db.query(DBReport).filter(DBReport.id == report_id).first()
    report_text = db_report.text if db_report else "Relato de segurança operacional"
    category = db_report.classification.category if db_report and db_report.classification else "Geral"

    rag_result = rag_engine.query_norm_with_gemini(
        query=report_text,
        category=category,
        report_text=report_text,
    )

    return NormQueryResultResponse(
        normTitle=rag_result["normTitle"],
        normResponse=rag_result["normResponse"],
        sourceExcerpt=rag_result["sourceExcerpt"],
        correctiveAction=rag_result["correctiveAction"],
        foundInKnowledgeBase=rag_result["foundInKnowledgeBase"],
    )
