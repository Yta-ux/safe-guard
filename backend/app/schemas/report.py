from pydantic import BaseModel, Field
from typing import Optional

class ReportBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Descrição do relato de acidente ou quase-acidente")
    sector: Optional[str] = Field(default="Operacional", description="Setor onde ocorreu o fato")

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: str
    createdAt: str

    class Config:
        from_attributes = True
