from enum import Enum

class RiskLevelEnum(str, Enum):
    CRITICO = "Crítico"
    MEDIO = "Médio"
    BAIXO = "Baixo"

class SectorEnum(str, Enum):
    OPERACIONAL = "Operacional"
    LOGISTICA = "Logística"
    ADMINISTRATIVO = "Administrativo"
    MANUTENCAO = "Manutenção"
    TI = "TI"
