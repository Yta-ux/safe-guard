# 🛡️ RELATÓRIO TÉCNICO FINAL — SAFEGUARD
## Sistema Inteligente de Suporte e Classificação Ocupacional em Segurança do Trabalho (SST)

**Projeto Final:** Assistente Inteligente de Suporte e Análise de Riscos Ocupacionais  
**Autor:** Ítalo Gustavo  
**Repositório do Projeto:** `safe-guard`  

---

## 1. Visão Geral e Contexto do Projeto

O **SafeGuard** é um ecossistema integrado para Segurança e Saúde no Trabalho (SST) projetado para resolver dois desafios críticos das indústrias e equipes de Engenharia de Segurança:
1. **Classificação Automática de Ocorrências:** Triagem e categorização precisa de relatos de acidentes e incidentes de trabalho em 7 grupos de risco alinhados às Normas Regulamentadoras (NRs) do Ministério do Trabalho e Emprego.
2. **Assistente Normativo RAG (IA Generativa):** Consulta inteligente e ancorada às Normas Regulamentadoras oficiais (NR-01 a NR-35), fornecendo recomendações técnicas embasadas com rastreabilidade auditável de fontes e proteção estrita contra alucinações.

O ecossistema combina **Machine Learning Clássico** para classificação de baixíssima latência (~2ms) com **IA Generativa / RAG** servidos por uma **API FastAPI** containerizada com **Docker**, acompanhada de uma interface visual em **React / Tailwind / Lucide**.

### 1.1 Coerência de Domínio (Atendimento Estrito à Seção 6 do Edital)
Conforme exigido na Seção 6 do Edital, **o dataset do classificador e a base do RAG pertencem rigorosamente ao mesmo universo temático (Segurança e Saúde no Trabalho — SST)**:
- **Insumo do Classificador:** Relatos reais de acidentes e incidentes de trabalho (*OSHA Construction Accidents*).
- **Insumo do RAG:** Base oficial de Normas Regulamentadoras de SST (*NR-01, NR-06, NR-10, NR-11, NR-12, NR-15, NR-17, NR-18, NR-20, NR-23, NR-26, NR-33, NR-35*).
- **Integração Temática Coesa:** Quando o classificador categoriza uma ocorrência em `Elétrico`, o sistema direciona a consulta do RAG para os requisitos técnicos da **NR-10 (Instalações Elétricas)**; quando prevê `Queda`, conecta-se à **NR-35 (Trabalho em Altura)** e **NR-18**; quando prevê `Esmagamento/Impacto`, aciona a **NR-12 (Máquinas)**. Dessa forma, ambos os componentes se complementam perfeitamente no mesmo domínio profissional.

---

## 2. Classificador de Solicitações

### 2.1 Base de Dados e Limpeza Criteriosa
- **Dataset:** *OSHA Construction Accidents* contendo **4.470 relatos reais de acidentes de trabalho**.
- **Auditoria de Dados Sujos:** Identificação e remoção conservadora de registros com rótulo nulo ou inválido (`cause='[]'`, `''`, `'nan'`), totalizando 4.468 registros válidos. A remoção foi preferida em relação à imputação manual para evitar viés.
- **Feature Engineering:** Concatenação da narrativa do acidente (`Summary2`) com as palavras-chave especialistas de SST (`newkeys`), gerando a coluna textual unificada `combined_text`.

### 2.2 Mapeamento de Domínio (7 Grupos de Risco Alinhados às NRs)
Para mitigar a alta dispersão das 25+ subcategorias originais da OSHA, foi realizado um agrupamento especialista em **7 classes principais de risco**:
1. **Queda** ➔ *NR-18 / NR-35 (Trabalho em Altura)* (43,2% dos casos)
2. **Esmagamento/Impacto** ➔ *NR-12 / NR-18 (Máquinas e Equipamentos)* (39,4% dos casos)
3. **Elétrico** ➔ *NR-10 (Instalações Elétricas)* (6,8% dos casos)
4. **Incêndio/Explosão** ➔ *NR-18 / NR-23 (Proteção Contra Incêndios)* (3,9% dos casos)
5. **Colapso Estrutural** ➔ *NR-18 (Escoramentos e Escavações)* (2,7% dos casos)
6. **Asfixia/Intoxicação** ➔ *NR-15 / NR-33 (Espaços Confinados / Insalubridade)* (1,4% dos casos)
7. **Outros** ➔ *NR-01 (Gerenciamento de Riscos Ocupacionais - PGR)* (2,6% dos casos)

### 2.3 Comparação de Abordagens (Pipelines)
Foram desenvolvidos e comparados pipelines distintos com divisão estratificada de dados (80% treino / 20% teste):

| Pipeline | Algoritmo | Vetorização | Estratégia de Balanço |
|---|---|---|---|
| **Pipeline A** | Logistic Regression | TF-IDF (n-gramas 1-2, 5.000 feat) | `class_weight='balanced'` |
| **Pipeline B** | LinearSVC High-Perf | TF-IDF (n-gramas 1-3, 10.000 feat, Sublinear TF) | `class_weight='balanced'` |

### 2.4 Avaliação de Desempenho
O **Pipeline B (LinearSVC)** superou a baseline em todas as métricas globais e por classe:

| Métrica | Pipeline A (Baseline) | Pipeline B (LinearSVC Proposto) | Ganho |
|---|---|---|---|
| **Acurácia** | 0.7937 (79,37%) | **0.8181 (81,81%)** | **+2.44%** |
| **Precision (Weighted)** | 0.8139 | **0.8354** | **+2.15%** |
| **Recall (Weighted)** | 0.7937 | **0.8181** | **+2.44%** |
| **F1 Weighted** | 0.7989 | **0.8175** | **+1.86%** |
| **F1 Macro (Métrica Principal)** | 0.7428 | **0.7884** | **+4.56%** |

#### Relatório Detalhado por Classe (Pipeline B):
```text
                     precision    recall  f1-score   support

Asfixia/Intoxicação     0.9091    0.7692    0.8333        13
 Colapso Estrutural     0.7857    0.9167    0.8462        24
           Elétrico     0.8667    0.8525    0.8595        61
Esmagamento/Impacto     0.8039    0.8184    0.8111       358
  Incêndio/Explosão     0.8710    0.7714    0.8182        35
             Outros     0.5484    0.7391    0.6296        23
              Queda     0.8427    0.8243    0.8333       387

           accuracy                         0.8181       901
          macro avg     0.8040    0.8131    0.7884       901
       weighted avg     0.8354    0.8181    0.8175       901
```

### 2.5 Interpretabilidade (XAI) & Análise de Erros
- **XAI (Coeficientes Lineares):** A inspeção dos coeficientes do `LinearSVC` confirmou que o modelo aprendeu termos semânticos altamente relevantes do domínio de SST:
  - *Queda:* `roof`, `scaffold`, `ladder`, `fell`, `height`
  - *Elétrico:* `power`, `line`, `electric`, `voltage`, `conductor`
  - *Esmagamento/Impacto:* `struck`, `crushed`, `loader`, `boom`, `excavator`
  - *Incêndio/Explosão:* `explosion`, `fire`, `gas`, `burn`, `vapor`
- **Análise de Erros:** As poucas confusões do modelo ocorrem predominantemente entre *Esmagamento/Impacto* e *Queda* em incidentes envolvendo quedas de objetos sobre trabalhadores em andaimes (dupla causalidade física real no relato).

### 2.6 Justificativa da Arquitetura (Tradução prévia vs Embeddings Brutos)
Experimentos com Embeddings Multilíngues, que tinha como objetivo classificar os textos sem a necessidade de tradução prévia, (`paraphrase-multilingual-MiniLM-L12-v2`), obtiveram **F1 Macro de ~0.71**, enquanto a arquitetura adotada (**Tradução técnica PT ➔ EN via API + LinearSVC especialista**) atingiu **F1 Macro de 0.7884**. Isso comprova que realizar o processo de tradução dos textos digitados pelo usuário sem delegar para ML, aumentam as métricas da solução final.


---

## 3. Assistente de Resposta via RAG (IA Generativa)

### 3.1 Base de Conhecimento Normativa
A base do RAG (`nrs_official.json`) foi construída a partir de trechos oficiais atualizados das Normas Regulamentadoras:
- **Normas Cobertas:** NR-01, NR-06, NR-10, NR-11, NR-12, NR-15, NR-17, NR-18, NR-20, NR-23, NR-26, NR-33 e NR-35.
- **Chunking:** Indexação estruturada contendo código da norma (`normCode`), título (`normTitle`), item normativo (`itemCode`), texto oficial (`text`) e palavras-chave de busca (`keywords`).

### 3.2 Busca Semântica & Preprocessamento de Queries
- **Vetorização:** TF-IDF com busca por similaridade de cosseno.
- **Preprocessamento Semântico:** Limpeza automatizada de prefixos de linguagem natural em português (ex: *"oq fazer para prevenir acidentes elétricos?"* ➔ *"prevenir acidentes elétricos"*), garantindo recuperação precisa de trechos da NR-10 sem falso-positivos de informação ausente.

### 3.3 Prompt de RAG e Proteção contra Alucinação
O prompt fornecido ao LLM (**Gemini 1.5 Flash**) força o ancoramento estrito no contexto recuperado:
- Se o trecho recuperado contiver a resposta, a IA gera recomendações objetivas em formato Markdown estruturado (Cards, Títulos, Checklist e Badges).
- Se a informação não constar nos trechos recuperados, o sistema retorna explicitamente **"Informação Ausente na Base Oficial de NRs"**, evitando qualquer alucinação técnica em segurança do trabalho.
- **Auditabilidade de Fontes:** Cada resposta gerada exibe visualmente os itens normativos exatos que embasaram a resposta (ex: `NR-10 (10.5.1)`, `NR-12 (12.38.1)`).

---

## 4. API que Serve o Sistema (FastAPI)

### 4.1 Arquitetura e Endpoints
O backend foi construído em **FastAPI** modularizado em rotas e serviços:
- **`POST /api/reports/classify-document`:** Recebe arquivo em PDF ou texto de relatório de investigação, realiza extração de texto/OCR, chama a tradução via Gemini/Fallback, executa a predição no `classifier_pipeline.joblib`, mapeia as NRs associadas e dispara o RAG automaticamente.
- **`POST /api/dashboard/rag-query`:** Endpoint para consultas diretas via assistente normativo RAG.
- **`GET /api/dashboard/stats`:** Estatísticas consolidadas e métricas do sistema.

### 4.2 Validação Pydantic e Serialização
- **Validação de Entrada/Saída:** Esquemas Pydantic rígidos (`ReportClassifyResponse`, `RagQueryRequest`, `RagQueryResponse`).
- **Serialização de Modelos:** O modelo de Machine Learning (`classifier_pipeline.joblib`), o codificador de rótulos (`label_encoder.joblib`) e a base de conhecimento RAG são carregados na inicialização da aplicação (sem re-treino por requisição), garantindo respostas em milissegundos.

---

## 5. Reflexão sobre Operação (MLOps, Custo e Latência)

### 5.1 Monitoramento e Detecção de Drift em Produção
- **Data Drift:** Alterações no vocabulário de relatórios de acidentes decorrentes da introdução de novos equipamentos (ex: drones na construção civil, energia solar/eólica).
- **Concept Drift:** Mudanças na legislação trabalhista ou revisões das NRs que alterem a definição técnica de um grupo de risco.
- **Detecção Prática:** Implementação de monitoramento baseado no teste estatístico **Kolmogorov-Smirnov (KS-test)** sobre as distribuições de probabilidade das predições e rastreamento da taxa de incerteza/confiança dos modelos ao longo do tempo. Quando o p-valor cai abaixo de 0.05, um alerta de re-treinamento é disparado.

### 5.2 Custo e Latência do RAG vs ML Clássico
- **Latência:**
  - Classificador de ML (`LinearSVC`): **~2ms** por inferência.
  - Assistente RAG (`Gemini 1.5 Flash`): **~750ms - 1.2s** por geração.
- **Análise de Custos:** O uso do tier gratuito do Gemini 1.5 Flash permite até 15 requisições/minuto sem custo. Em escala comercial de alta volumetria, a implementação de um **Cache Semântico (Redis)** para perguntas frequentes reduz chamadas ao LLM em até 65%, otimizando custos e latência.

### 5.3 Limites do Sistema
- **Dependência da Qualidade de Tradução:** Relatos em português regional com gírias muito específicas dependem da precisão da camada de tradução do Gemini.
- **Caráter Auxiliar:** O sistema atua como ferramenta de suporte à decisão para o SESMT/CIPA, não substituindo a responsabilidade legal e a assinatura de um Engenheiro de Segurança do Trabalho habilitado.

---

## 6. Instruções de Execução e Reprodução

### 6.1 Execução via Docker Compose (Recomendado)
```bash
# Clone do repositório
git clone https://github.com/italo-gustavo/safe-guard.git
cd safe-guard

# Inicialização de todos os serviços (Backend FastAPI + Frontend React + Nginx)
docker compose up -d --build
```
Acesse a aplicação no navegador em: **`http://localhost:8080`**

### 6.2 Execução Local do Notebook (Componente A)
```bash
cd notebooks
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # ou pacotes: pandas numpy scikit-learn matplotlib seaborn joblib
jupyter notebook classificador.ipynb
```

---

## 7. Exemplos e Arquivos de Teste

Para facilitar os testes de validação do sistema pelo usuário e avaliadores, a pasta [`examples`](file:///home/italo-gustavo/Documentos/Projects/safe-guard/examples) contém insumos prontos para uso:

1. **Perguntas para o Assistente RAG (`perguntas_exemplo.txt`):**
   - Arquivo: [`examples/perguntas_exemplo.txt`](file:///home/italo-gustavo/Documentos/Projects/safe-guard/examples/perguntas_exemplo.txt)
   - **Descrição:** Conjunto estruturado de perguntas cobrindo as 7 categorias de risco (NR-10, NR-12, NR-18, NR-20, NR-23, NR-33, NR-35) e casos out-of-scope para validação de ausência de alucinação no RAG.

2. **Relatório Simulado para Classificação de Documentos (`relatorio_exemplo.txt` e `relatorio_exemplo.md`):**
   - Arquivos: [`examples/relatorio_exemplo.txt`](file:///home/italo-gustavo/Documentos/Projects/safe-guard/examples/relatorio_exemplo.txt) e [`examples/relatorio_exemplo.md`](file:///home/italo-gustavo/Documentos/Projects/safe-guard/examples/relatorio_exemplo.md)
   - **Descrição:** Documento que simula um relatório real de investigação de acidente de trabalho (envolvendo manutenção em painel elétrico energizado). Pode ser utilizado para testar o upload de documentos ou colagem de texto no endpoint `/api/reports/classify-document` e na interface web do SafeGuard.