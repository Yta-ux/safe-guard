from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.db.session import get_db
from app.db.models import Report as DBReport, Classification as DBClassification
from app.schemas.dashboard import (
    DashboardStatsResponse,
    CategoryDistribution,
    SectorDistribution,
    DashboardRagQueryRequest,
    DashboardRagQueryResponse,
)
from app.routers.reports import build_report_response
from app.services.rag_service import rag_engine

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Calcula métricas e distribuições estatísticas reais consultando o PostgreSQL."""
    total_reports = db.query(DBReport).count()

    # Contagem real por Nível de Risco no PostgreSQL
    critical_count = db.query(DBClassification).filter(DBClassification.risk_level == "Crítico").count()
    low_count = db.query(DBClassification).filter(DBClassification.risk_level == "Baixo").count()
    medium_count = db.query(DBClassification).filter(DBClassification.risk_level == "Médio").count()

    total = max(1, total_reports)

    category_dist = [
        CategoryDistribution(
            category="Baixo",
            count=low_count,
            percentage=round((low_count / total) * 100, 1),
        ),
        CategoryDistribution(
            category="Médio",
            count=medium_count,
            percentage=round((medium_count / total) * 100, 1),
        ),
        CategoryDistribution(
            category="Crítico",
            count=critical_count,
            percentage=round((critical_count / total) * 100, 1),
        ),
    ]

    # Distribuição real por Setor no PostgreSQL
    sector_counts = (
        db.query(DBReport.sector, func.count(DBReport.id))
        .group_by(DBReport.sector)
        .all()
    )

    sector_dist = [
        SectorDistribution(sector=sector or "Operacional", count=count)
        for sector, count in sector_counts
    ]

    if not sector_dist:
        sector_dist = [
            SectorDistribution(sector="Operacional", count=0),
            SectorDistribution(sector="Logística", count=0),
            SectorDistribution(sector="Manutenção", count=0),
            SectorDistribution(sector="Administrativo", count=0),
            SectorDistribution(sector="TI", count=0),
        ]

    return DashboardStatsResponse(
        totalReports=total_reports,
        totalReportsTrend="+100% real",
        criticalCount=critical_count,
        criticalTrend=f"{critical_count} críticos",
        lowCount=low_count,
        lowTrend=f"{low_count} baixos",
        categoryDistribution=category_dist,
        sectorDistribution=sector_dist,
    )


@router.post("/rag-query", response_model=DashboardRagQueryResponse)
async def query_dashboard_rag(payload: DashboardRagQueryRequest):
    """Consulta semântica RAG agregada de Normas Regulamentadoras com Gemini AI."""
    rag_result = rag_engine.query_norm_with_gemini(query=payload.query)

    chunks = rag_engine.search_chunks(payload.query, top_k=1)
    norm_code = chunks[0]["normCode"] if chunks else "NR Geral"
    applicable_sectors = ["Operacional", "Logística", "Manutenção"]

    return DashboardRagQueryResponse(
        query=payload.query,
        normTitle=rag_result["normTitle"],
        normCode=norm_code,
        summary=rag_result["normResponse"],
        sourceExcerpt=rag_result["sourceExcerpt"],
        preventiveAction=rag_result["correctiveAction"],
        foundInKnowledgeBase=rag_result["foundInKnowledgeBase"],
        applicableSectors=applicable_sectors,
    )
