from pydantic import BaseModel
from typing import List
from app.schemas.classification import ReportWithClassificationResponse

class CategoryDistribution(BaseModel):
    category: str
    count: int
    percentage: float

class SectorDistribution(BaseModel):
    sector: str
    count: int

class DashboardStatsResponse(BaseModel):
    totalReports: int
    totalReportsTrend: str
    criticalCount: int
    criticalTrend: str
    lowCount: int
    lowTrend: str
    categoryDistribution: List[CategoryDistribution]
    sectorDistribution: List[SectorDistribution]

class DashboardRagQueryRequest(BaseModel):
    query: str

class DashboardRagQueryResponse(BaseModel):
    query: str
    normTitle: str
    normCode: str
    summary: str
    sourceExcerpt: str
    preventiveAction: str
    foundInKnowledgeBase: bool
    applicableSectors: List[str]
