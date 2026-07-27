from pydantic import BaseModel
from typing import Optional, List
from app.schemas.enums import RiskLevelEnum
from app.schemas.report import ReportResponse

class ClassificationResultResponse(BaseModel):
    id: str
    reportId: str
    category: str
    riskLevel: RiskLevelEnum
    confidence: float
    translatedText: Optional[str] = None  # Tradução técnica em Inglês para auditoria do modelo ML
    xaiExplanation: str
    xaiHighlightedTerms: List[str]
    xaiJustification: str
    isManualOverride: bool = False
    correctionReason: Optional[str] = None
    createdAt: str

    class Config:
        from_attributes = True

class ReportWithClassificationResponse(BaseModel):
    id: str
    text: str
    sector: Optional[str] = None
    createdAt: str
    classification: ClassificationResultResponse

class ClassifyReportResponse(BaseModel):
    report: ReportResponse
    classification: ClassificationResultResponse

class ClassificationUpdate(BaseModel):
    category: str
    riskLevel: RiskLevelEnum
    correctionReason: Optional[str] = None

class NormQueryResultResponse(BaseModel):
    normTitle: str
    normResponse: str
    sourceExcerpt: str
    correctiveAction: str
    foundInKnowledgeBase: bool
