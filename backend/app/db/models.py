import datetime
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(50), primary_key=True, index=True)
    text = Column(Text, nullable=False)
    sector = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    classification = relationship("Classification", back_populates="report", uselist=False, cascade="all, delete-orphan")

class Classification(Base):
    __tablename__ = "classifications"

    id = Column(String(50), primary_key=True, index=True)
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False, unique=True)
    category = Column(String(150), nullable=False)
    risk_level = Column(String(50), nullable=False)  # 'Crítico', 'Médio', 'Baixo'
    confidence = Column(Float, nullable=False)
    translated_text = Column(Text, nullable=True)  # Tradução técnica em Inglês gerada pela LLM
    xai_explanation = Column(Text, nullable=True)
    xai_highlighted_terms = Column(JSON, nullable=True)
    xai_justification = Column(Text, nullable=True)
    is_manual_override = Column(Boolean, default=False)
    correction_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    report = relationship("Report", back_populates="classification")

class RagQueryLog(Base):
    __tablename__ = "rag_query_logs"

    id = Column(String(50), primary_key=True, index=True)
    query_text = Column(Text, nullable=False)
    norm_code = Column(String(50), nullable=True)
    norm_title = Column(String(200), nullable=True)
    response_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
