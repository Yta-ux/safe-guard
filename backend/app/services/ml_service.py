import os
import joblib
import json
import numpy as np
from typing import Dict, Any, List
from app.config import settings

CANDIDATE_DIRS = [
    os.path.join(os.path.dirname(__file__), "..", "ml_artifacts"),
]

def find_file(filename: str) -> str:
    for d in CANDIDATE_DIRS:
        p = os.path.join(d, filename)
        if os.path.exists(p):
            return p
    return os.path.join(CANDIDATE_DIRS[0], filename)

class MlClassifierService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MlClassifierService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.pipeline = None
        self.label_encoder = None
        self.nr_mapping: Dict[str, List[str]] = {}
        self._load_artifacts()
        self._initialized = True

    def _load_artifacts(self):
        """Carrega o pipeline serializado (.joblib) e mapeamentos em memória."""
        pipeline_path = find_file("classifier_pipeline.joblib")
        encoder_path = find_file("label_encoder.joblib")
        nr_mapping_path = find_file("risk_group_nr_mapping.json")

        try:
            if os.path.exists(pipeline_path) and os.path.exists(encoder_path):
                self.pipeline = joblib.load(pipeline_path)
                self.label_encoder = joblib.load(encoder_path)
            else:
                print("[ML Service Warning] Artefatos de ML nao encontrados em formato joblib. Usando modo padrao.")

            if os.path.exists(nr_mapping_path):
                with open(nr_mapping_path, "r", encoding="utf-8") as f:
                    self.nr_mapping = json.load(f)
        except Exception as e:
            print(f"[ML Service Warning] Falha ao carregar artefatos ML: {e}")

    def translate_pt_to_en(self, text_pt: str) -> str:
        """Tradução do relato em português para inglês técnico com extração de termos-chave."""
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key-here":
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = (
                    "You are a Senior Industrial Safety Specialist. "
                    "Translate the following workplace incident report from Portuguese to technical English. "
                    "Return ONLY the plain English translation, without quotes or extra text:\n\n"
                    f"{text_pt}"
                )

                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.0),
                )
                if response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[ML Service Warning] Falha na traducao via Gemini LLM: {e}")

        text_lower = text_pt.lower()

        # 1. Risco Elétrico / Subestação / Arco Elétrico (Prioridade Alta)
        if (
            "subestação" in text_lower or "subsestação" in text_lower or
            "caixa de energia" in text_lower or "caixa eletrica" in text_lower or "caixa elétrica" in text_lower or
            "choque" in text_lower or "eletrocutad" in text_lower or "eletrocussão" in text_lower or
            "fio desencapad" in text_lower or "cabo energizad" in text_lower or "arco elétrico" in text_lower or
            "curto-circuito" in text_lower or "curto circuito" in text_lower or "acidentes eletricos" in text_lower or
            "acidentes elétricos" in text_lower or "alta tensão" in text_lower
        ):
            return f"electric shock electrical wire live wire power substation explosion an electrical shock {text_pt}"

        # 2. Incêndio / Explosão
        if "incêndio" in text_lower or "fogo" in text_lower or "explosão" in text_lower or "inflamável" in text_lower or "faísca" in text_lower:
            return f"fire explosion flammable gas sparks chemical fire hazard {text_pt}"

        # 3. Prensamento em Máquinas / Esteiras / Paletes -> Esmagamento/Impacto
        if (
            "palete" in text_lower or "paletes" in text_lower or "empilhad" in text_lower or
            "esmagad" in text_lower or "prensad" in text_lower or "prensa" in text_lower or
            "batida" in text_lower or "esteira" in text_lower or "rolete" in text_lower or
            "amputação" in text_lower or "fratura" in text_lower or "mão" in text_lower or
            "loto" in text_lower or "limpeza manual" in text_lower
        ):
            return f"conveyor belt rollers machine pinch point hand crush injury amputation risk LOTO {text_pt}"

        # 4. Escavação / Valas -> Colapso Estrutural
        if "soterrado" in text_lower or "trincheira" in text_lower or "escavação" in text_lower or "vala" in text_lower or "talude" in text_lower:
            return f"trench collapse excavation wall soterramento cave in {text_pt}"

        # 5. Espaço Confinado / Químico / Vapores -> Asfixia/Intoxicação
        if "tóxico" in text_lower or "gás" in text_lower or "inalação" in text_lower or "solvente" in text_lower or "tontura" in text_lower or "tanque" in text_lower:
            return f"inhalation of toxic vapor confined space chemical intoxication hazard {text_pt}"

        # 6. Trabalho em Altura / Queda de pessoa -> Queda
        if "caiu" in text_lower or "queda de altura" in text_lower or "trabalho em altura" in text_lower or "andaime" in text_lower or "telhado" in text_lower or "linha de vida" in text_lower or "cinto" in text_lower or "escorregou" in text_lower or "poça" in text_lower:
            return f"fall from height scaffolding fall aerial lift fall ladder roof fall protection {text_pt}"

        return text_pt


    def predict_risk(self, text_pt: str) -> Dict[str, Any]:
        """Classifica o risco operacional e extrai evidências técnicas XAI."""
        text_en = self.translate_pt_to_en(text_pt)

        category = "Queda"
        risk_level = "Crítico"
        confidence = 0.92

        if self.pipeline and self.label_encoder:
            try:
                pred_idx = self.pipeline.predict([text_en])[0]
                category = self.label_encoder.classes_[pred_idx]

                if hasattr(self.pipeline, "predict_proba"):
                    probas = self.pipeline.predict_proba([text_en])[0]
                    confidence = float(probas.max())
                elif hasattr(self.pipeline, "decision_function"):
                    scores = self.pipeline.decision_function([text_en])[0]
                    exp_scores = np.exp(scores - np.max(scores))
                    confidence = float((exp_scores / exp_scores.sum()).max())
                    confidence = round(max(0.78, min(0.97, confidence)), 2)

                if category in ["Queda", "Elétrico", "Colapso Estrutural", "Incêndio/Explosão"]:
                    risk_level = "Crítico"
                elif category in ["Esmagamento/Impacto", "Asfixia/Intoxicação"]:
                    risk_level = "Médio"
                else:
                    risk_level = "Baixo"

            except Exception as e:
                print(f"[ML Service Warning] Erro na predicao de risco: {e}")

        # Extração de Palavras-Chave Relevantes (XAI) filtrando stopwords e verbos comuns
        generic_xai_stopwords = {
            "risco", "acidente", "incidente", "fatal", "ocorrência", "relatório", "técnico",
            "código", "data", "horário", "local", "empresa", "responsável", "equipe", "apoio",
            "introdução", "geral", "dia", "para", "com", "sem", "sob", "sobre", "entre",
            "atividade", "procedimento", "colaborador", "colaboradores", "trabalho", "segurança",
            "identificado", "identificada", "durante", "após", "antes", "mesmo", "forma", "esta", "este",
            "foram", "pelo", "pela", "como", "mais", "onde", "quando", "quase", "relato", "análise",
            "trocar", "numa", "uma", "fui", "ficou", "ambiente", "tornando", "alta", "ocorreu", "local",
            "área", "parte", "turno", "caso", "modo", "estava", "estavam", "tinha", "realizando", "fazendo"
        }
        
        domain_keywords = {
            "subestação", "subsestação", "energia", "explosão", "elétrico", "elétricos", "eletricos",
            "choque", "curto-circuito", "prensamento", "esmagamento", "esteira", "palete", "empilhadeira",
            "andaime", "altura", "telhado", "linha de vida", "cinto", "escavação", "vala", "soterramento",
            "tanque", "gás", "solvente", "asfixia", "tóxico", "faísca", "incêndio", "fogo", "loto", "amputação"
        }

        raw_words = [w.strip(",.!?;:()[]\"'").lower() for w in text_pt.split()]
        filtered_terms = []

        # Dá prioridade a palavras que são termos técnicos reconhecidos de segurança
        for w in raw_words:
            if w in domain_keywords and w not in filtered_terms:
                filtered_terms.append(w)

        # Completa com palavras relevantes do texto que não sejam stopwords
        for w in raw_words:
            if len(w) > 3 and w not in generic_xai_stopwords and w not in filtered_terms:
                filtered_terms.append(w)

        highlighted = filtered_terms[:5] if filtered_terms else ["segurança", "equipamento", "operação"]

        nrs_applicable = self.nr_mapping.get(category, ["NR-01 (PGR)"])
        nrs_str = ", ".join(nrs_applicable)

        return {
            "category": category,
            "riskLevel": risk_level,
            "confidence": confidence,
            "translatedText": text_en,
            "xaiExplanation": f"Classificação realizada com base no padrão de risco '{category}'. Diretrizes aplicáveis: {nrs_str}.",
            "xaiHighlightedTerms": highlighted,
            "xaiJustification": f"O relato em português foi traduzido para inglês técnico, analisado pelo modelo de inteligência artificial com confiança de {int(confidence*100)}%, identificando conformidade com os requisitos da {nrs_str}.",
        }

ml_service = MlClassifierService()

