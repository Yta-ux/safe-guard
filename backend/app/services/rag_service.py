import json
import os
import glob
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from app.config import settings

KB_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "nrs_official.json")
DOCS_DIR_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "docs")


class RagEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RagEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.chunks: List[Dict[str, Any]] = []
        self.embeddings: Optional[np.ndarray] = None
        self.encoder = None
        self.tfidf_vectorizer = None
        self._encoder_loaded = False

        self._load_knowledge_base()
        self._load_external_docs()
        self._initialized = True

    def _load_knowledge_base(self):
        """Carrega a base estruturada de NRs oficiais."""
        if not os.path.exists(KB_FILE_PATH):
            return

        try:
            with open(KB_FILE_PATH, "r", encoding="utf-8") as f:
                self.chunks = json.load(f)
        except Exception as err:
            print(f"[RAG Service] Erro ao carregar base de conhecimento: {err}")

    def _load_external_docs(self):
        """Lê dinamicamente arquivos de normas salvos no diretório de documentos."""
        if not os.path.exists(DOCS_DIR_PATH):
            os.makedirs(DOCS_DIR_PATH, exist_ok=True)
            return

        doc_files = glob.glob(os.path.join(DOCS_DIR_PATH, "*.[tT][xX][tT]")) + \
                    glob.glob(os.path.join(DOCS_DIR_PATH, "*.[mM][dD]"))

        for file_path in doc_files:
            file_name = os.path.basename(file_path)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                if content:
                    self.chunks.append({
                        "normCode": file_name.replace(".txt", "").replace(".md", "").upper(),
                        "normTitle": f"Documento Técnico Externo: {file_name}",
                        "itemCode": "Doc-Ext",
                        "text": content[:1000],
                        "applicableCategory": "Geral",
                    })
            except Exception as err:
                print(f"[RAG Service] Erro ao ler documento {file_name}: {err}")

    def _ensure_embeddings(self):
        """Inicialização tardia (lazy loading) dos embeddings para evitar travamento na inicialização."""
        if self.embeddings is not None:
            return

        texts = [chunk["text"] for chunk in self.chunks]
        if not texts:
            return

        # TF-IDF primário rápido para não travar a aplicação em ambientes Docker sem GPU/modelo local
        self.tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2))
        self.embeddings = self.tfidf_vectorizer.fit_transform(texts).toarray()

        # Tenta carregar o SentenceTransformer em background ou se disponível
        if not self._encoder_loaded:
            try:
                from sentence_transformers import SentenceTransformer
                self.encoder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
                self.embeddings = self.encoder.encode(texts, show_progress_bar=False)
                self._encoder_loaded = True
            except Exception:
                # Mantém TF-IDF se a lib não estiver presente ou o download falhar
                self.encoder = None
                self._encoder_loaded = True

    def _preprocess_query(self, query: str) -> str:
        """Remove expressões de ruído da consulta para busca semântica purificada."""
        q_clean = query.lower()
        noise_phrases = [
            "oq fazer para prevenir", "o que fazer para prevenir", "como prevenir", "como evitar",
            "quais as regras para", "o que diz a norma sobre", "quais as obrigações para",
            "oq fazer para", "o que fazer", "quais são os cuidados com", "como agir em caso de"
        ]
        for np_phrase in noise_phrases:
            q_clean = q_clean.replace(np_phrase, "")

        q_clean = q_clean.strip()
        return q_clean if len(q_clean) > 2 else query

    def search_chunks(
        self,
        query: str,
        category_filter: Optional[str] = None,
        top_k: int = 3,
        similarity_threshold: float = 0.05
    ) -> List[Dict[str, Any]]:
        """Realiza busca por similaridade de cosseno com TF-IDF / embeddings semânticos."""
        if not self.chunks:
            return []

        self._ensure_embeddings()
        if self.embeddings is None:
            return []

        clean_query = self._preprocess_query(query)

        if self.encoder:
            try:
                query_emb = self.encoder.encode([clean_query])
            except Exception:
                query_emb = self.tfidf_vectorizer.transform([clean_query]).toarray()
        elif self.tfidf_vectorizer:
            query_emb = self.tfidf_vectorizer.transform([clean_query]).toarray()
        else:
            return []

        similarities = cosine_similarity(query_emb, self.embeddings)[0]
        scores = similarities.copy()

        if category_filter:
            for idx, chunk in enumerate(self.chunks):
                if chunk.get("applicableCategory", "").lower() == category_filter.lower():
                    scores[idx] += 0.15

        clean_words = [w for w in clean_query.split() if len(w) > 3]
        for idx, chunk in enumerate(self.chunks):
            chunk_text = (chunk.get("text", "") + " " + chunk.get("normTitle", "")).lower()
            for word in clean_words:
                if word in chunk_text:
                    scores[idx] += 0.10

        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            if scores[idx] >= similarity_threshold:
                chunk_data = self.chunks[idx].copy()
                chunk_data["score"] = float(scores[idx])
                results.append(chunk_data)

        if not results and len(self.chunks) > 0:
            for idx in top_indices[:2]:
                chunk_data = self.chunks[idx].copy()
                chunk_data["score"] = float(scores[idx])
                results.append(chunk_data)

        return results

    def query_norm_with_gemini(
        self,
        query: str,
        category: Optional[str] = None,
        report_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Consulta RAG com síntese via Gemini API ou resposta padrão estruturada."""
        search_text = f"{query} {report_text or ''} {category or ''}".strip()
        relevant_chunks = self.search_chunks(search_text, category_filter=category, top_k=3, similarity_threshold=0.15)

        if not relevant_chunks:
            return {
                "normTitle": "Norma Regulamentadora — Informação Ausente",
                "normResponse": f"A base de conhecimento de segurança do trabalho não possui trechos diretos sobre '{query}'. Recomenda-se consulta direta às NRs do MTE.",
                "sourceExcerpt": "Nenhum trecho de Norma Regulamentadora foi encontrado para esta consulta.",
                "correctiveAction": "Solicitar parecer técnico do Engenheiro de Segurança do Trabalho.",
                "foundInKnowledgeBase": False,
            }

        top_chunk = relevant_chunks[0]
        context_excerpts = "\n\n".join([f"[{c['normCode']} item {c['itemCode']}]: {c['text']}" for c in relevant_chunks])

        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key-here":
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = (
                    "Você é um Auditor e Engenheiro Sênior de Segurança do Trabalho (MTE/NR Brasil).\n"
                    "Analise o relato do incidente e relacione com os trechos das NRs abaixo.\n\n"
                    f"--- NORMAS REGULAMENTADORAS ---\n{context_excerpts}\n\n"
                    f"--- RELATO DO INCIDENTE ---\n{report_text or query}\n"
                    f"Categoria: {category or 'Geral'}\n\n"
                    "Estruture a resposta em Markdown nos tópicos:\n"
                    "### Enquadramento Regulatório Oficial\n"
                    "### Avaliação do Perigo e Potencial de Danos\n"
                    "### Plano de Ação Preventivo e Corretivo\n"
                    "### Checklist de Inspeção Técnica de Campo"
                )

                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.1),
                )

                gemini_text = response.text.strip() if response.text else top_chunk["text"]

                return {
                    "normTitle": top_chunk["normTitle"],
                    "normResponse": gemini_text,
                    "sourceExcerpt": top_chunk["text"],
                    "correctiveAction": f"Aplicação imediata dos requisitos previstos no item {top_chunk['itemCode']} da {top_chunk['normCode']}.",
                    "foundInKnowledgeBase": True,
                }

            except Exception as err:
                print(f"[RAG Service] Indisponibilidade da API Gemini, aplicando fallback local: {err}")

        fallback_norm_response = (
            f"### Enquadramento Regulatório Oficial ({top_chunk['normCode']})\n"
            f"Conforme estabelecido pela **{top_chunk['normTitle']}**, item **{top_chunk['itemCode']}**:\n"
            f"\"{top_chunk['text']}\"\n\n"
            f"### Análise do Risco Ocupacional ({category or 'Geral'})\n"
            f"A ocorrência reportada descumpre os requisitos mínimos previstos na {top_chunk['normCode']}. "
            f"Exige-se a adoção de medidas imediatas de engenharia e controle de processo para eliminar o risco.\n\n"
            f"### Plano de Ação Preventivo e Corretivo\n"
            f"1. **Adequação Física:** Instalação e revisão dos dispositivos de proteção conforme item {top_chunk['itemCode']}.\n"
            f"2. **Bloqueio de Energia (LOTO):** Garantir o seccionamento e travamento das fontes de energia.\n"
            f"3. **Procedimentos (APR/PT):** Emissão obrigatória da Análise Preliminar de Risco e Permissão de Trabalho.\n"
            f"4. **Capacitação:** Treinamento operacional e instrução diária de segurança (DDS).\n\n"
            f"### Checklist de Inspeção de Campo\n"
            f"- [ ] Verificação da integridade das proteções físicas e sistemas de segurança.\n"
            f"- [ ] Validação do procedimento de bloqueio de energia e etiquetas LOTO.\n"
            f"- [ ] Emissão e assinatura da Permissão de Trabalho pelo responsável técnico."
        )

        return {
            "normTitle": top_chunk["normTitle"],
            "normResponse": fallback_norm_response,
            "sourceExcerpt": top_chunk["text"],
            "correctiveAction": f"Treinamento operacional e adequação dos equipamentos segundo a {top_chunk['normCode']}.",
            "foundInKnowledgeBase": True,
        }


rag_engine = RagEngine()
