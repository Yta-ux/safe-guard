-- ============================================================
-- SafeGuard Risk Safety System — PostgreSQL Database DDL
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(50) PRIMARY KEY,
    text TEXT NOT NULL,
    sector VARCHAR(100) DEFAULT 'Operacional',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classifications (
    id VARCHAR(50) PRIMARY KEY,
    report_id VARCHAR(50) NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
    category VARCHAR(150) NOT NULL,
    risk_level VARCHAR(50) NOT NULL, -- 'Crítico', 'Médio', 'Baixo'
    confidence DOUBLE PRECISION NOT NULL,
    translated_text TEXT,             -- Tradução técnica em Inglês para auditoria do modelo ML
    xai_explanation TEXT,
    xai_highlighted_terms JSONB DEFAULT '[]'::jsonb,
    xai_justification TEXT,
    is_manual_override BOOLEAN DEFAULT FALSE,
    correction_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rag_query_logs (
    id VARCHAR(50) PRIMARY KEY,
    query_text TEXT NOT NULL,
    norm_code VARCHAR(50),
    norm_title VARCHAR(200),
    response_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de alta performance para a Dashboard e relatórios
CREATE INDEX IF NOT EXISTS idx_classifications_risk_level ON classifications(risk_level);
CREATE INDEX IF NOT EXISTS idx_classifications_category ON classifications(category);
CREATE INDEX IF NOT EXISTS idx_reports_sector ON reports(sector);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
