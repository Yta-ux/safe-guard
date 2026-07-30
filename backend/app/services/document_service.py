"""
SafeGuard — Serviço de Processamento de Documentos (Backend)

Responsável por:
1. Extrair texto completo de PDFs, TXT, CSV, JSON, etc.
2. Analisar o documento INTEIRO (todas as páginas)
3. Filtrar e ranquear palavras-chave de segurança do trabalho
4. Mapear sinônimos técnicos PT/EN
5. Gerar um resumo condensado para alimentar o classificador ML
"""

import io
import re
import json
from collections import Counter
from typing import Dict, List, Tuple

# Dicionário de sinônimos e termos técnicos de segurança do trabalho
# Mapeia variações comuns em português para o termo-chave canônico
SAFETY_SYNONYMS: Dict[str, str] = {
    # Queda
    "caiu": "queda",
    "caíram": "queda",
    "escorregou": "queda",
    "escorregão": "queda",
    "tropeçou": "queda",
    "deslizou": "queda",
    "desabou": "queda",
    "despencou": "queda",
    "precipitou": "queda",
    "tombou": "queda",
    "telhado": "trabalho em altura",
    "andaime": "trabalho em altura",
    "escada": "trabalho em altura",
    "laje": "trabalho em altura",
    "altura": "trabalho em altura",
    "guarda-corpo": "proteção coletiva",
    "parapeito": "proteção coletiva",
    "linha de vida": "proteção individual",
    "cinto": "proteção individual",
    "arnês": "proteção individual",
    # Elétrico
    "choque": "risco elétrico",
    "eletrocutado": "risco elétrico",
    "eletrocussão": "risco elétrico",
    "curto-circuito": "risco elétrico",
    "curto": "risco elétrico",
    "fio": "condutor elétrico",
    "cabo": "condutor elétrico",
    "fiação": "condutor elétrico",
    "desencapado": "condutor exposto",
    "exposto": "condutor exposto",
    "faísca": "fonte de ignição",
    "centelha": "fonte de ignição",
    "solda": "operação com calor",
    "soldagem": "operação com calor",
    "maçarico": "operação com calor",
    # Incêndio / Explosão
    "incêndio": "incêndio",
    "fogo": "incêndio",
    "chamas": "incêndio",
    "explosão": "explosão",
    "explodiu": "explosão",
    "inflamável": "material inflamável",
    "combustível": "material inflamável",
    "tinner": "solvente inflamável",
    "solvente": "solvente inflamável",
    "acetileno": "gás inflamável",
    "glp": "gás inflamável",
    "extintor": "combate a incêndio",
    "hidrante": "combate a incêndio",
    "sprinkler": "combate a incêndio",
    # Esmagamento / Impacto
    "esmagado": "esmagamento",
    "esmagamento": "esmagamento",
    "prensado": "esmagamento",
    "prensa": "equipamento de prensagem",
    "empilhadeira": "veículo industrial",
    "guindaste": "equipamento de içamento",
    "grua": "equipamento de içamento",
    "ponte rolante": "equipamento de içamento",
    "paletes": "carga empilhada",
    "empilhados": "carga empilhada",
    "desabamento": "colapso de carga",
    # Colapso Estrutural
    "trincheira": "escavação",
    "vala": "escavação",
    "escavação": "escavação",
    "escoramento": "contenção estrutural",
    "soterrado": "soterramento",
    "soterramento": "soterramento",
    "desmoronamento": "colapso estrutural",
    "trincas": "falha estrutural",
    "rachadura": "falha estrutural",
    # Asfixia / Intoxicação
    "gás": "agente químico",
    "tóxico": "agente tóxico",
    "inalação": "exposição por inalação",
    "inalou": "exposição por inalação",
    "asfixia": "asfixia",
    "sufocamento": "asfixia",
    "tontura": "sintoma de intoxicação",
    "enjoo": "sintoma de intoxicação",
    "náusea": "sintoma de intoxicação",
    "desmaio": "sintoma de intoxicação",
    "espaço confinado": "espaço confinado",
    "tanque": "espaço confinado",
    "silo": "espaço confinado",
    "ventilação": "sistema de ventilação",
    "exaustor": "sistema de ventilação",
    # EPIs
    "epi": "equipamento de proteção",
    "capacete": "EPI - cabeça",
    "luvas": "EPI - mãos",
    "óculos": "EPI - olhos",
    "protetor auricular": "EPI - auditivo",
    "máscara": "EPI - respiratório",
    "bota": "EPI - pés",
    "botina": "EPI - pés",
    # NRs
    "nr-01": "NR-01 PGR",
    "nr-10": "NR-10 Elétrica",
    "nr-12": "NR-12 Máquinas",
    "nr-15": "NR-15 Insalubridade",
    "nr-18": "NR-18 Construção",
    "nr-20": "NR-20 Inflamáveis",
    "nr-23": "NR-23 Incêndio",
    "nr-33": "NR-33 Confinado",
    "nr-35": "NR-35 Altura",
    # Termos gerais de risco
    "acidente": "acidente de trabalho",
    "incidente": "incidente operacional",
    "lesão": "lesão corporal",
    "ferimento": "lesão corporal",
    "fratura": "lesão grave",
    "amputação": "lesão grave",
    "óbito": "fatalidade",
    "morte": "fatalidade",
    "fatal": "fatalidade",
    "risco": "risco ocupacional",
    "perigo": "risco ocupacional",
    "irregularidade": "não conformidade",
    "sinalização": "sinalização de segurança",
    "isolamento": "isolamento de área",
    "interditado": "interdição",
    "embargo": "interdição",
    "vazamento": "vazamento de substância",
    "derrame": "vazamento de substância",
    "óleo": "fluido lubrificante",
}

# Stopwords em português para remoção
PT_STOPWORDS = {
    "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
    "por", "para", "com", "sem", "sob", "sobre", "entre", "até",
    "que", "qual", "quais", "como", "onde", "quando", "porque",
    "não", "mais", "muito", "também", "ainda", "mesmo", "outro",
    "outra", "outros", "outras", "este", "esta", "esse", "essa",
    "aquele", "aquela", "isto", "isso", "aquilo", "seu", "sua",
    "seus", "suas", "meu", "minha", "nosso", "nossa", "ele", "ela",
    "eles", "elas", "nós", "vocês", "foi", "ser", "ter", "haver",
    "estar", "uma", "uns", "umas", "são", "está", "era", "foram",
    "será", "seria", "sendo", "sido", "tenho", "tinha", "tem",
    "pode", "deve", "após", "antes", "cada", "todo", "toda",
    "todos", "todas", "dia", "hora", "ano", "vez", "vezes",
    "já", "sim", "bem", "mas", "porém", "pois", "então",
    "assim", "logo", "aqui", "ali", "lá", "cá", "essa",
    "essa", "nesse", "nessa", "desse", "dessa", "pelo", "pela",
    "pelos", "pelas", "aos", "às", "num", "numa", "nuns", "numas",
}


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extrai texto completo de TODAS as páginas de um PDF com suporte resiliente multi-estratégia."""
    pages_text = []

    # Estratégia 1: pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text and text.strip():
                    pages_text.append(text.strip())
                    print(f"  [Doc Service pypdf] Página {i + 1}: {len(text)} caracteres extraídos")
            except Exception as page_err:
                print(f"  [Doc Service WARNING] pypdf erro na página {i + 1}: {page_err}")
    except Exception as err:
        print(f"  [Doc Service WARNING] pypdf falhou: {err}")

    if pages_text:
        full_text = "\n".join(pages_text)
        print(f"  [Doc Service] Total extraído do PDF (pypdf): {len(full_text)} caracteres")
        return full_text

    # Estratégia 2: PyPDF2 fallback
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text and text.strip():
                    pages_text.append(text.strip())
            except Exception:
                pass
    except Exception as err:
        print(f"  [Doc Service WARNING] PyPDF2 fallback falhou: {err}")

    if pages_text:
        return "\n".join(pages_text)

    # Estratégia 3: Regex fallback para extração de blocos de texto brutos
    try:
        raw_str = pdf_bytes.decode("latin-1", errors="ignore")
        text_blocks = re.findall(r"\((.*?)\)", raw_str)
        extracted = " ".join([b for b in text_blocks if len(b) > 3 and not b.startswith("/")])
        if len(extracted.strip()) > 20:
            print(f"  [Doc Service] Extraídos {len(extracted)} chars via Regex Fallback.")
            return extracted
    except Exception as regex_err:
        print(f"  [Doc Service WARNING] Regex fallback falhou: {regex_err}")

    return ""


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Extrai texto de qualquer tipo de arquivo suportado."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        return extract_text_from_pdf_bytes(file_bytes)

    if ext in ("txt", "md", "log", "csv"):
        return file_bytes.decode("utf-8", errors="ignore")

    if ext == "json":
        try:
            data = json.loads(file_bytes.decode("utf-8", errors="ignore"))
            if isinstance(data, dict):
                return " ".join(str(v) for v in data.values())
            if isinstance(data, list):
                return " ".join(str(item) for item in data)
            return str(data)
        except json.JSONDecodeError:
            return file_bytes.decode("utf-8", errors="ignore")

    # Fallback: tenta ler como texto bruto
    return file_bytes.decode("utf-8", errors="ignore")


def tokenize_and_clean(text: str) -> List[str]:
    """Tokeniza o texto, remove stopwords e pontuação."""
    # Normaliza quebras de linha e pontuação
    text = re.sub(r"[^\w\sáàâãéèêíïóôõöúçñ/-]", " ", text.lower())
    text = re.sub(r"\s+", " ", text).strip()

    tokens = text.split()
    # Remove stopwords e tokens muito curtos
    return [t for t in tokens if t not in PT_STOPWORDS and len(t) > 2]


def extract_safety_keywords(full_text: str) -> Tuple[List[str], List[str], Dict[str, int]]:
    """
    Analisa o documento INTEIRO e extrai:
    1. keywords: lista de termos-chave canônicos de segurança ordenados por relevância e severidade
    2. raw_matches: as palavras originais do texto que bateram no dicionário
    3. frequency: contagem ponderada de ocorrências de cada termo canônico
    """
    tokens = tokenize_and_clean(full_text)
    total_tokens = len(tokens)

    canonical_counter: Counter = Counter()
    raw_matches: List[str] = []
    text_lower = full_text.lower()

    # Identifica blocos narrativos de maior relevância (Descrição, Consequências, Causas)
    narrative_boost = 1
    narrative_keywords = ["esmagamento", "amputação", "fratura", "prensado", "queda", "caiu", "soterrado", "intoxicação", "asfixia", "incêndio"]

    # Varredura token a token pelo dicionário de sinônimos
    for token in tokens:
        if token in SAFETY_SYNONYMS:
            canonical = SAFETY_SYNONYMS[token]
            weight = 3 if any(nk in token or nk in canonical for nk in narrative_keywords) else 1
            canonical_counter[canonical] += weight
            if token not in raw_matches:
                raw_matches.append(token)

    # Busca por bi-gramas (ex: "espaço confinado", "linha de vida")
    bigram_terms = [k for k in SAFETY_SYNONYMS.keys() if " " in k]
    for bigram in bigram_terms:
        count = text_lower.count(bigram)
        if count > 0:
            canonical = SAFETY_SYNONYMS[bigram]
            weight = 3 if any(nk in bigram or nk in canonical for nk in narrative_keywords) else 1
            canonical_counter[canonical] += (count * weight)
            if bigram not in raw_matches:
                raw_matches.append(bigram)

    # Ordena por relevância/peso (mais relevantes primeiro)
    sorted_keywords = [k for k, _ in canonical_counter.most_common()]

    print(f"  [Doc Service] Tokens analisados: {total_tokens}")
    print(f"  [Doc Service] Termos de segurança encontrados: {len(sorted_keywords)}")
    print(f"  [Doc Service] Top keywords: {sorted_keywords[:10]}")
    print(f"  [Doc Service] Palavras originais matched: {raw_matches[:10]}")

    return sorted_keywords, raw_matches, dict(canonical_counter)


def build_classification_input(
    full_text: str,
    keywords: List[str],
    raw_matches: List[str],
    max_chars: int = 2000,
) -> str:
    """
    Constrói o texto condensado que será enviado ao classificador ML.
    Combina as palavras-chave extraídas com trechos relevantes do documento.
    """
    # Parte 1: Lista de termos-chave canônicos (mais importante para o modelo)
    keywords_section = "Termos-chave identificados: " + ", ".join(keywords[:15])

    # Parte 2: Extrai frases do documento que contenham as palavras matched
    sentences = re.split(r"[.\n]", full_text)
    relevant_sentences: List[str] = []

    for sentence in sentences:
        sentence_clean = sentence.strip()
        if len(sentence_clean) < 10:
            continue
        sentence_lower = sentence_clean.lower()
        # Verifica se a frase contém alguma palavra-chave
        for match in raw_matches[:20]:
            if match in sentence_lower:
                if sentence_clean not in relevant_sentences:
                    relevant_sentences.append(sentence_clean)
                break

    # Parte 3: Monta o texto final condensado
    context_section = " | ".join(relevant_sentences[:8])

    final_text = f"{keywords_section}. Contexto: {context_section}"

    # Garante que não excede o limite
    if len(final_text) > max_chars:
        final_text = final_text[:max_chars]

    return final_text


def process_document(filename: str, file_bytes: bytes) -> Dict:
    """
    Pipeline completo de processamento de documento:
    1. Extrai texto de todas as páginas
    2. Analisa todo o conteúdo em busca de termos de segurança
    3. Mapeia sinônimos técnicos
    4. Gera texto condensado para o classificador ML
    5. Retorna metadados de análise para o frontend
    """
    full_text = extract_text_from_file(filename, file_bytes)

    if not full_text or len(full_text.strip()) < 10:
        return {
            "success": False,
            "error": "Não foi possível extrair texto do documento. Verifique se o arquivo não está protegido ou vazio.",
            "fullText": "",
            "keywords": [],
            "rawMatches": [],
            "classificationInput": "",
            "stats": {"totalChars": 0, "totalTokens": 0, "keywordsFound": 0},
        }

    keywords, raw_matches, frequency = extract_safety_keywords(full_text)
    classification_input = build_classification_input(full_text, keywords, raw_matches)
    tokens = tokenize_and_clean(full_text)

    return {
        "success": True,
        "fullText": full_text,
        "keywords": keywords[:20],
        "rawMatches": raw_matches[:20],
        "frequency": frequency,
        "classificationInput": classification_input,
        "stats": {
            "totalChars": len(full_text),
            "totalPages": full_text.count("\n") + 1,
            "totalTokens": len(tokens),
            "keywordsFound": len(keywords),
        },
    }

