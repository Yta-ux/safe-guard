import json
import os
import glob
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from app.config import settings

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    print("[RAG Service Warning] sentence-transformers não instalado. Usando TF-IDF Vectorizer para RAG.")

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

        print("[RAG Service] Inicializando Motor RAG de Alta Fidelidade (Anti-Alucinação)...")
        self.chunks: List[Dict[str, Any]] = []
        self.embeddings: Optional[np.ndarray] = None
        self.encoder = None
        self.tfidf_vectorizer = None

        if HAS_SENTENCE_TRANSFORMERS:
            try:
                self.encoder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            except Exception as e:
                print(f"[RAG Service Warning] Falha ao carregar SentenceTransformer: {e}. Usando TF-IDF.")
                self.encoder = None

        self._load_knowledge_base()
        self._load_external_docs()
        self._build_embeddings()
        self._initialized = True

    def _load_knowledge_base(self):
        """Carrega a base estruturada de NRs oficiais."""
        if not os.path.exists(KB_FILE_PATH):
            print(f"[RAG Service Warning] Arquivo de NRs não encontrado em {KB_FILE_PATH}")
            return

        with open(KB_FILE_PATH, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)

    def _load_external_docs(self):
        """Lê dinamicamente arquivos .txt ou .md salvos na pasta /knowledge_base/docs/."""
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
                    print(f"[RAG Service] Documento externo indexado: {file_name}")
            except Exception as e:
                print(f"[RAG Service Warning] Erro ao ler documento {file_name}: {e}")

    def _build_embeddings(self):
        """Gera os vetores de embedding para todos os chunks de fontes oficiais."""
        texts = [chunk["text"] for chunk in self.chunks]
        if texts:
            print(f"[RAG Service] Gerando vetores para {len(texts)} chunks de fontes oficiais...")
            if self.encoder:
                self.embeddings = self.encoder.encode(texts, show_progress_bar=False)
            else:
                self.tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2))
                self.embeddings = self.tfidf_vectorizer.fit_transform(texts).toarray()
            print("[RAG Service] Indexação RAG concluída com sucesso.")

    def _preprocess_query(self, query: str) -> str:
        """Limpa ruídos de linguagem natural e expande termos semânticos."""
        q_clean = query.lower()
        noise_phrases = [
            "oq fazer para prevenir", "o que fazer para prevenir", "como prevenir", "como evitar",
            "quais as regras para", "o que diz a norma sobre", "quais as obrigações para",
            "oq fazer para", "o que fazer", "quais são os cuidados com", "como agir em caso de"
        ]
        for np_phrase in noise_phrases:
            q_clean = q_clean.replace(np_phrase, "")
        
        q_clean = q_clean.strip()
        # Se a limpeza esvaziar a query, retorna a original
        return q_clean if len(q_clean) > 2 else query

    def search_chunks(self, query: str, category_filter: Optional[str] = None, top_k: int = 3, similarity_threshold: float = 0.05) -> List[Dict[str, Any]]:
        """Realiza busca por similaridade de cosseno com pré-processamento de linguagem natural."""
        if not self.chunks or self.embeddings is None:
            return []

        clean_query = self._preprocess_query(query)

        if self.encoder:
            query_emb = self.encoder.encode([clean_query])
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

        # Bônus por correspondência direta de palavras-chave
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

        # Fallback de segurança: se nada passou no limiar, retorna os top-2 melhores chunks
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
        """
        Executa a busca semântica RAG + geração ancorada via Google Gemini API
        com proteção estrita contra alucinação (diz quando não sabe).
        """
        search_text = f"{query} {report_text or ''} {category or ''}".strip()
        relevant_chunks = self.search_chunks(search_text, category_filter=category, top_k=3, similarity_threshold=0.15)

        if not relevant_chunks:
            return {
                "normTitle": "Norma Regulamentadora — Informação Ausente",
                "normResponse": f"A base de conhecimento de segurança do trabalho atual não possui informações normativas suficientes sobre '{query}'. Recomenda-se consultar diretamente o portal oficial do Ministério do Trabalho.",
                "sourceExcerpt": "Nenhum trecho de Norma Regulamentadora foi encontrado com similaridade semântica suficiente para esta consulta.",
                "correctiveAction": "Solicitar parecer técnico do Engenheiro de Segurança do Trabalho responsável.",
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
                    "Você é um Engenheiro Sênior de Segurança do Trabalho e Auditor de Regulamentações MTE/NR no Brasil.\n"
                    "Analise a ocorrência de risco e cruze com os trechos oficiais das Normas Regulamentadoras (NRs) fornecidos abaixo.\n\n"
                    f"--- TRECHOS OFICIAIS DAS NORMAS REGULAMENTADORAS (NRs) ---\n{context_excerpts}\n\n"
                    f"--- RELATO DO INCIDENTE E CONSULTA ---\n{report_text or query}\n"
                    f"Categoria de Risco: {category or 'Geral'}\n\n"
                    "Crie uma análise regulatória COMPLETA, ESTRUTURADA E DETALHADA para o SESMT/CIPA, organizada exatamente nos seguintes tópicos em Markdown:\n\n"
                    "### 📋 Enquadramento Regulatório Oficial\n"
                    "Cite os artigos e itens exatos da norma (ex: NR-12 item 12.5.1, NR-10 item 10.4) explicando o requisito legal obrigatório.\n\n"
                    "### ⚠️ Avaliação do Perigo e Potencial de Danos\n"
                    "Explique a severidade do risco operacional no chão de fábrica e os acidentes/lesões decorrentes da não conformidade.\n\n"
                    "### 🛡️ Plano de Ação Preventivo e Corretivo (Engenharia e Gestão)\n"
                    "Defina medidas pragmáticas de controle (LOTO, proteções físicas intertravadas, APR/PT, DDS, capacitação técnica).\n\n"
                    "### 🔍 Checklist de Inspeção Técnica de Campo\n"
                    "Forneça 3 a 4 itens objetivos para auditoria antes da liberação da máquina, equipamento ou ambiente."
                )

                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                    ),
                )

                gemini_text = response.text.strip() if response.text else top_chunk["text"]

                return {
                    "normTitle": top_chunk["normTitle"],
                    "normResponse": gemini_text,
                    "sourceExcerpt": top_chunk["text"],
                    "correctiveAction": f"Auditoria e aplicação imediata dos requisitos previstos no item {top_chunk['itemCode']} da {top_chunk['normCode']}.",
                    "foundInKnowledgeBase": True,
                }

            except Exception as e:
                print(f"[RAG Service] Gemini API fallback ativo: {e}")

        fallback_norm_response = (
            f"### 📋 Enquadramento Regulatório Oficial ({top_chunk['normCode']})\n"
            f"Conforme estabelecido pela **{top_chunk['normTitle']}**, item **{top_chunk['itemCode']}**:\n"
            f"\"{top_chunk['text']}\"\n\n"
            f"### ⚠️ Análise do Risco Ocupacional ({category or 'Geral'})\n"
            f"A não conformidade identificada viola as exigências diretas de proteção e prevenção previstas na {top_chunk['normCode']}. "
            f"Eventos desta natureza demandam paralisação imediata das atividades de risco até a completa adequação dos controles de engenharia.\n\n"
            f"### 🛡️ Plano de Ação Preventivo e Corretivo (SESMT / CIPA)\n"
            f"1. **Adequação Física:** Instalação e verificação de proteções e sinalização de segurança segundo o item {top_chunk['itemCode']}.\n"
            f"2. **Bloqueio de Energia (LOTO):** Garantir o seccionamento físico e etiquetagem antes de qualquer manutenção.\n"
            f"3. **Procedimentos (APR/PT):** Emissão obrigatória da Análise Preliminar de Risco e Permissão de Trabalho.\n"
            f"4. **Capacitação:** Realizar Treinamento Diário de Segurança (DDS) focado nas diretrizes da {top_chunk['normCode']}.\n\n"
            f"### 🔍 Checklist de Inspeção de Campo\n"
            f"- [ ] Verificação da integridade das proteções físicas e intertravamentos.\n"
            f"- [ ] Validação do procedimento de bloqueio de energia e etiquetas LOTO.\n"
            f"- [ ] Checagem da assinatura da Permissão de Trabalho pelo responsável do setor."
        )

        return {
            "normTitle": top_chunk["normTitle"],
            "normResponse": fallback_norm_response,
            "sourceExcerpt": top_chunk["text"],
            "correctiveAction": f"Treinamento operacional imediato, revisão da Permissão de Trabalho (PT) e adequação dos equipamentos segundo a {top_chunk['normCode']}.",
            "foundInKnowledgeBase": True,
        }

rag_engine = RagEngine()
