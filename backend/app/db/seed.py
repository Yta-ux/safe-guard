import os
import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.db.models import Base, Report, Classification

SEED_REPORTS = [
    {
        "id": "RL-4029",
        "text": "Vazamento de óleo lubrificante perto da prensa hidráulica 3 no galpão de usinagem, gerando poça escorregadia em área de circulação intensa.",
        "translated_text": "Lubricating oil leak near hydraulic press 3 in the machining hall, creating a slippery puddle in a high-traffic operator area.",
        "sector": "Operacional",
        "category": "Queda",
        "risk_level": "Crítico",
        "confidence": 0.94,
        "xai_explanation": "Identificação de fluido lubrificante sem contenção secundária em piso de trânsito de operadores.",
        "xai_highlighted_terms": ["vazamento de óleo", "prensa hidráulica", "poça escorregadia", "circulação intensa"],
        "xai_justification": "Derrame de produto químico lubrificante sem sinalização primária em zona operacional ativa configura risco crítico de queda de mesmo nível.",
        "days_ago": 0,
    },
    {
        "id": "RL-4028",
        "text": "Paletes de madeira empilhados irregularmente no setor B da logística, acima da altura limite de 2 metros permitida pelas normas internas.",
        "translated_text": "Wooden pallets stacked irregularly in logistics sector B, above the 2-meter height limit allowed by internal safety standards.",
        "sector": "Logística",
        "category": "Esmagamento/Impacto",
        "risk_level": "Médio",
        "confidence": 0.89,
        "xai_explanation": "Pilha de carga instável disposta em altura sem amarração secundária.",
        "xai_highlighted_terms": ["paletes de madeira", "empilhados irregularmente", "altura limite"],
        "xai_justification": "Sobreposição inadequada de materiais dispostos em altura sem travamento lateral configura potencial risco de desabamento sobre vias circundantes.",
        "days_ago": 1,
    },
    {
        "id": "RL-4027",
        "text": "Operador atuando sem luvas de proteção térmica e sem máscara durante procedimento de solda elétrica na estrutura do galpão 2.",
        "translated_text": "Operator working without thermal protection gloves and face mask during electrical welding procedure on shed 2 structure.",
        "sector": "Manutenção",
        "category": "Elétrico",
        "risk_level": "Crítico",
        "confidence": 0.96,
        "xai_explanation": "Ausência de Equipamento de Proteção Individual (EPI) obrigatório durante operação com calor excessivo e radiação não ionizante.",
        "xai_highlighted_terms": ["sem luvas", "solda elétrica", "sem máscara", "galpão 2"],
        "xai_justification": "Inobservância da obrigatoriedade de EPIs de barreira em atividade com arco elétrico expõe o trabalhador a queimaduras severas e choque elétrico.",
        "days_ago": 1,
    },
    {
        "id": "RL-4026",
        "text": "Cadeira ergonômica danificada na sala 2 do setor administrativo, apresentando folga e instabilidade no pistão a gás de ajuste de altura.",
        "translated_text": "Damaged ergonomic chair in administrative room 2, presenting slack and instability in the gas lift height adjustment piston.",
        "sector": "Administrativo",
        "category": "Outros",
        "risk_level": "Baixo",
        "confidence": 0.82,
        "xai_explanation": "Defeito mecânico leve em mobiliário de escritório sem risco imediato de colapso repentino.",
        "xai_highlighted_terms": ["cadeira ergonômica", "folga no pistão", "sala 2"],
        "xai_justification": "Desconformidade ergonômica na postura de trabalho que exige substituição preventiva para evitar desconforto musculoesquelético acumulativo.",
        "days_ago": 2,
    },
    {
        "id": "RL-4025",
        "text": "Ausência de guarda-corpo e linha de vida no andaime montado para pintura externa da fachada do edifício administrativo a 6 metros de altura.",
        "translated_text": "Absence of guardrail and lifeline on scaffolding erected for exterior painting of the administrative building facade at a 6-meter height.",
        "sector": "Operacional",
        "category": "Queda",
        "risk_level": "Crítico",
        "confidence": 0.97,
        "xai_explanation": "Trabalho em altura acima de 2.00m realizado sem proteção coletiva física ou individual de ancoragem.",
        "xai_highlighted_terms": ["ausência de guarda-corpo", "sem linha de vida", "andaime", "6 metros de altura"],
        "xai_justification": "A execução de tarefas em estruturas elevadas sem barreira física nem cinto tipo paraquedista viola diretamente a NR-18 e NR-35.",
        "days_ago": 3,
    },
    {
        "id": "RL-4024",
        "text": "Cheiro forte de solvente químico e tontura relatada por dois funcionários durante limpeza de tanque interno sem exaustor ligado.",
        "translated_text": "Strong chemical solvent odor and dizziness reported by two workers during internal tank cleaning without exhaust fan operating.",
        "sector": "Operacional",
        "category": "Asfixia/Intoxicação",
        "risk_level": "Crítico",
        "confidence": 0.93,
        "xai_explanation": "Acúmulo de vapores orgânicos tóxicos em ambiente confinado sem sistema ativo de ventilação mecânica.",
        "xai_highlighted_terms": ["cheiro forte de solvente", "tontura", "tanque interno", "sem exaustor"],
        "xai_justification": "Trabalho em espaço confinado sem monitoramento prévio de gases atmosféricos descumpre os requisitos mandatórios da NR-33.",
        "days_ago": 4,
    },
    {
        "id": "RL-4023",
        "text": "Cabo de alimentação da lixadeira angular apresentando isolamento desgastado e condutor de cobre exposto perto da bancada de metal.",
        "translated_text": "Power cord of angle grinder showing worn insulation and exposed copper conductor near the metal workbench.",
        "sector": "Manutenção",
        "category": "Elétrico",
        "risk_level": "Crítico",
        "confidence": 0.95,
        "xai_explanation": "Equipamento elétrico portátil operando com isolamento primário danificado.",
        "xai_highlighted_terms": ["cabo de alimentação", "isolamento desgastado", "cobre exposto", "bancada de metal"],
        "xai_justification": "O contato acidental com partes eletricamente energizadas em bancadas metálicas condutoras acarreta risco imediato de choque grave.",
        "days_ago": 5,
    },
    {
        "id": "RL-4022",
        "text": "Escavação de trincheira para tubulação com 2,20m de profundidade apresentando trincas na borda e sem escoramento lateral de contenção.",
        "translated_text": "Piping trench excavation 2.20 meters deep presenting cracks on the edge without lateral shoring containment.",
        "sector": "Operacional",
        "category": "Colapso Estrutural",
        "risk_level": "Crítico",
        "confidence": 0.96,
        "xai_explanation": "Vala profunda sem blindagem ou contenção em solo instável.",
        "xai_highlighted_terms": ["escavação de trincheira", "2,20m de profundidade", "trincas na borda", "sem escoramento"],
        "xai_justification": "Escavações com mais de 1,25m de profundidade exigem obrigatoriamente escoramento ou taludamento conforme item 18.12 da NR-18.",
        "days_ago": 6,
    },
    {
        "id": "RL-4021",
        "text": "Faíscas e superaquecimento observados durante transferência de produto inflamável perto do depósito de tambores de tinner.",
        "translated_text": "Sparks and overheating observed during transfer of flammable liquid near the paint thinner drum storage area.",
        "sector": "Logística",
        "category": "Incêndio/Explosão",
        "risk_level": "Crítico",
        "confidence": 0.91,
        "xai_explanation": "Presença de fonte de ignição próxima a atmosfera potencialmente inflamável de vapores combustíveis.",
        "xai_highlighted_terms": ["faíscas", "superaquecimento", "produto inflamável", "tambores de tinner"],
        "xai_justification": "Atividades geradoras de fagulhas em depósitos de inflamáveis sem aterramento estático descumprem a NR-20 e NR-23.",
        "days_ago": 7,
    },
    {
        "id": "RL-4020",
        "text": "Caixas de papelão obstruindo a rota de fuga e a porta de saída de emergência do segundo andar do setor de TI.",
        "translated_text": "Cardboard boxes obstructing the escape route and emergency exit door on the second floor of the IT department.",
        "sector": "TI",
        "category": "Outros",
        "risk_level": "Baixo",
        "confidence": 0.85,
        "xai_explanation": "Bloqueio parcial de via de evacuação de emergência sem risco imediato de colapso.",
        "xai_highlighted_terms": ["caixas de papelão", "obstruindo rota de fuga", "saída de emergência"],
        "xai_justification": "Inconformidade no fluxo de evacuação que necessita desobstrução imediata conforme diretrizes da NR-23.",
        "days_ago": 8,
    },
]

def seed_database():
    """Popula a base de dados PostgreSQL com relatos e classificações realistas."""
    print("[Seed Script] Conectando ao banco de dados PostgreSQL...")
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        existing_count = session.query(Report).count()
        if existing_count > 0:
            print(f"[Seed Script] Banco de dados já contém {existing_count} relatos. Seeding verificado.")
            return

        print("[Seed Script] Inserindo relatos e classificações de teste...")
        now = datetime.utcnow()

        for item in SEED_REPORTS:
            created_dt = now - timedelta(days=item["days_ago"])

            report = Report(
                id=item["id"],
                text=item["text"],
                sector=item["sector"],
                created_at=created_dt,
            )

            classification = Classification(
                id=item["id"],
                report_id=item["id"],
                category=item["category"],
                risk_level=item["risk_level"],
                confidence=item["confidence"],
                translated_text=item.get("translated_text"),
                xai_explanation=item["xai_explanation"],
                xai_highlighted_terms=item["xai_highlighted_terms"],
                xai_justification=item["xai_justification"],
                created_at=created_dt,
            )

            session.add(report)
            session.add(classification)

        session.commit()
        print(f"[Seed Script] Sucesso! {len(SEED_REPORTS)} relatos e classificações populados no PostgreSQL com tradução técnica.")

    except Exception as e:
        session.rollback()
        print(f"[Seed Script Error] Falha ao popular o banco: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
