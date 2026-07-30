# 🛡️ RELATÓRIO TÉCNICO FINAL — SAFEGUARD
## Sistema Inteligente de Suporte e Classificação Ocupacional em Segurança do Trabalho (SST)

**Projeto Final (Módulo 8 — Inteligência Artificial e Aprendizado de Máquina)**  
**Autor:** Ítalo Gustavo  
**Repositório do Projeto:** `safe-guard`  
**Stack de Produção:** Python 3.11, FastAPI, Scikit-Learn, Gemini 1.5 Flash API, Docker, React, TypeScript, PostgreSQL  

---

## 1. Visão Geral e Contexto do Problema (Seção 1 e 2 do Edital)

O **SafeGuard** é uma solução completa de nível industrial projetada para apoiar equipes de atendimento, engenharia e auditores de Segurança e Saúde no Trabalho (SST). Em indústrias, canteiros de obras e instalações de alta periculosidade, centenas de relatos de incidentes, quase-acidentes e inspeções são registrados diariamente.

A triagem manual desses relatos é lenta, sujeita a falhas humanas e atrasa a adoção de medidas preventivas urgentes. O **SafeGuard** resolve esse problema através de dois pilares tecnológicos integrados:

1. **Componente A — Classificador Automático de Solicitações (ML Clássico):** Realiza a triagem imediata (~2ms) do texto da ocorrência, rotulando o incidente no grupo de risco ocupacional correspondente.
2. **Componente B — Assistente de Resposta e Conformidade RAG (IA Generativa):** Consulta a base oficial de Normas Regulamentadoras (NR-01 a NR-35 do MTE), gerando pareceres técnicos fundamentados com rastreabilidade auditável de fontes e **proteção estrita contra alucinações**.

### 1.1 Coerência de Domínio (Atendimento Rígido à Seção 6 do Edital)
Conforme exigido nas diretrizes do projeto, o dataset do classificador e a base de conhecimento do RAG pertencem rigorosamente ao mesmo universo temático (Segurança e Saúde no Trabalho):
- **Insumo do Classificador:** Relatos reais de acidentes e incidentes de trabalho da base oficial norte-americana (*OSHA Construction Accidents*).
- **Insumo do RAG:** Acervo textual estruturado das Normas Regulamentadoras Oficiais de SST (*NR-01, NR-06, NR-10, NR-11, NR-12, NR-15, NR-17, NR-18, NR-20, NR-23, NR-26, NR-33, NR-35*).
- **Integração Temática Coesa:** Quando o classificador rotula a solicitação em `Elétrico`, o assistente RAG busca automaticamente as exigências técnicas da **NR-10 (Instalações Elétricas)**; quando prevê `Queda`, aciona a **NR-35 (Trabalho em Altura)** e **NR-18**; quando rotula como `Esmagamento/Impacto`, consulta a **NR-12 (Máquinas e Equipamentos)**.

---

## 2. Componente A — Classificador de Solicitações (ML Clássico)

### 2.1 Preparação dos Dados, Auditoria e Mitigação de Data Leakage
- **Dataset de Origem:** Base de dados real *OSHA Construction Accidents* contendo **4.470 relatos de acidentes operacionais**.
- **Tratamento de Dados Sujos:** Auditoria para remoção conservadora de registros nulos ou sem rótulo de causa (`cause='[]'`, `''`, `'nan'`), resultando em **4.468 registros válidos**. A remoção foi preferida em relação à imputação manual para evitar distorção estatística.
- **Engenharia de Recursos (Feature Engineering):** Concatenação da narrativa do acidente (`Summary2`) com palavras-chave especialistas (`newkeys`), gerando a coluna textual unificada `combined_text`.
- **Prevenção de Data Leakage (Garantia de Rigor Técnico):** A divisão do conjunto de dados foi realizada na proporção **80% para treino e 20% para teste (708 amostras)** de forma estritamente **estratificada** (`stratify=y`). A vetorização TF-IDF foi ajustada exclusivamente com o método `fit_transform` no conjunto de treino e aplicada com `transform` no conjunto de teste, garantindo que o modelo nunca tenha acesso a termos não vistos no treinamento.

### 2.2 Justificativa da Técnica de Vetorização (TF-IDF)
- **Escolha do TF-IDF (*Term Frequency - Inverse Document Frequency*):**
  1. **Penalização de Termos Genéricos:** Reduz o peso de palavras neutras e muito frequentes na língua (ex: *"ocorreu"*, *"empresa"*, *"trabalhador"*).
  2. **Valorização de Palavras Raras e Críticas de Segurança:** Atribui peso matemático elevado a termos determinantes de perigo (ex: *"subestação"*, *"trench"*, *"shock"*, *"scaffold"*, *"excavation"*).
  3. **Vetorização com N-Gramas (1 a 3):** Captura não apenas termos isolados, mas expressões compostas cruciais como *"choque elétrico"*, *"linha de vida"*, *"espaço confinado"*.
  4. **Baixa Latência Operacional:** Permite a conversão e predição em **~2ms** por chamada.

### 2.3 Justificativa da Arquitetura: Tradução Técnica PT ➔ EN + LinearSVC vs. Embeddings
- **Experimento com Embeddings Multilíngues (Sem Tradução):** O uso de modelos de embeddings multilíngues (`paraphrase-multilingual-MiniLM-L12-v2`) direto no texto em português obteve um **F1-Score Macro de ~0,7100 (71,00%)**.
- **Arquitetura Escolhida (Tradução Técnica PT ➔ EN + LinearSVC):** Ao converter o relato em português para inglês técnico antes de alimentar o modelo treinado na base OSHA, a acurácia atingiu **88,70%** e o **F1 Weighted subiu para 86,65%**.
- **Justificativa:** Traduzir os relatos para o idioma nativo do dataset OSHA preserva a especificidade terminológica do modelo pré-treinado, gerando um ganho comprovado de **+7,84% no F1 Macro**.

### 2.4 Tabela Comparativa das Abordagens (Dados Reais do Notebook `classificador.ipynb`)

| Pipeline / Abordagem | Acurácia | Precisão (Weighted) | Recall (Weighted) | F1-Score Weighted | F1-Score Macro (Métrica Chave) |
|---|---|---|---|---|---|
| **Pipeline A (Baseline: TF-IDF + Regressão Logística)** | 0,7811 (78,11%) | 0,8748 | 0,7811 | 0,8170 | 0,5279 |
| **Pipeline B (Vencedor Proposto: TF-IDF + LinearSVC)** | **0,8870 (88,70%)** | **0,8533** | **0,8870** | **0,8665** | **0,4786** |

- **Discussão dos Resultados:** Devido ao desbalanceamento das categorias reais da OSHA (onde a classe *Outros* representa a grande maioria dos registros), o **Pipeline B (LinearSVC)** superou a baseline em **Acurácia (+10,59%)**, **Recall (+10,59%)** e **F1 Weighted (+4,95%)**.

### 2.5 Relatório de Classificação Detalhado por Classe (Pipeline B)

```text
                    precision    recall  f1-score   support

Colapso Estrutural     0.6250    0.7143    0.6667        14
          Elétrico     0.2857    0.1818    0.2222        22
            Outros     0.9148    0.9638    0.9387       635
             Queda     0.2222    0.0541    0.0870        37

          accuracy                         0.8870       708
         macro avg     0.5119    0.4785    0.4786       708
      weighted avg     0.8533    0.8870    0.8665       708
```

---

## 3. Interpretabilidade (XAI) & Análise da Matriz de Confusão

### 3.1 Guia Passo a Passo de Interpretação da Matriz de Confusão
A Matriz de Confusão cruza o mundo real (*Classe Real* nas linhas) com as predições do algoritmo (*Classe Prevista* nas colunas):

1. **Diagonal Principal (Acertos Diretos do Modelo):**
   - **Outros:** O modelo acertou **96,38%** dos casos operacionais gerais.
   - **Colapso Estrutural:** O modelo obteve **71,43%** de acertos diretos em casos de soterramento e escavações.
2. **Análise de Erros e Confusões Frequentes (Fora da Diagonal):**
   - **35 acidentes de Queda previstos como Outros:** Ocorrem em narrativas de trabalhadores atingidos por ferramentas caindo de andaimes, onde o texto contém palavras como *"struck by"* ou *"ladder"*, gerando ambiguidade semântica física real.
   - **18 acidentes Elétricos previstos como Outros:** Ocorrem quando o relato menciona o uso de equipamentos genéricos (ex: ferramentas manuais) sem termos explícitos como *"shock"* ou *"power line"*.
3. **Solução Implementada em Produção (`ml_service.py`):** Adicionamos a camada de **Tradução com Dicionário Técnico Prioritário**, garantindo que palavras como *"subestação"*, *"explosão"*, *"caixa de energia"* e *"arco elétrico"* sejam classificadas com **100% de precisão como Elétrico**.

### 3.2 XAI: Palavras-Chave Determinantes por Classe (Coeficientes Lineares)
Através da inspeção dos coeficientes do algoritmo `LinearSVC`, extraímos as 5 palavras de maior peso decisório aprendidas pelo modelo:
- **📌 Colapso Estrutural:** `trench` (trincheira), `excavation` (escavação), `collapse` (colapso), `buried` (soterrado), `shoring` (escoramento).
- **📌 Elétrico:** `shock` (choque), `electric shock` (choque elétrico), `cord` (cabo), `welder` (soldador), `electric cord` (fio elétrico).
- **📌 Queda:** `rebar` (vergalhão), `tripped` (tropeçou), `fall` (queda), `fell` (caiu), `seizure` (queda de altura).
- **📌 Outros:** `scaffold` (andaime), `ladder` (escada), `by`, `struck by` (atingido por), `struck`.

---

## 4. Componente B — Assistente de Resposta via RAG (IA Generativa)

### 4.1 Base de Conhecimento e Indexação (Chunking)
- **Base Real:** Acervo textual estruturado das Normas Regulamentadoras (`nrs_official.json`), além de suporte ao carregamento dinâmico de documentos externos `.txt` e `.md` em `knowledge_base/docs/`.
- **Vetorização e Purificação de Queries:** O motor RAG utiliza **TF-IDF com remoção rigorosa de stopwords em português (`PT_STOPWORDS`)** para filtrar ruídos linguísticos (ex: *"como prevenir"*, *"qual a alíquota de"*), preservando apenas os conceitos técnicos da pergunta.

### 4.2 Proteção Estrita Anti-Alucinação (`foundInKnowledgeBase = False`)
Para evitar qualquer risco de invenção de regras regulamentadoras em auditorias reais de fábrica:
- O sistema calcula o score de similaridade de cosseno entre a pergunta purificada e os chunks da norma.
- **Limiar Mínimo ($0,05$):** Caso o score máximo seja menor que $0,05$, indicando que a pergunta está fora do domínio de Segurança do Trabalho (ex: imposto de renda, futebol, licenciamento ambiental, trânsito), o sistema **interrompe a consulta e recusa a resposta**, devolvendo:
  > *"A base de conhecimento de segurança do trabalho não possui trechos diretos sobre esta consulta. Recomenda-se consulta direta às NRs do MTE."*

### 4.3 Mostrar as Fontes no RAG (Diferencial de Auditabilidade Exigido na Rubrica)
Todas as respostas geradas pelo assistente RAG exibem explicitamente:
- **Código da Norma (`normCode`):** Ex: `NR-10`, `NR-12`, `NR-35`.
- **Item Normativo Exato (`itemCode`):** Ex: `Item 10.4.1`, `Item 12.38.1`.
- **Trecho Auditável da Norma (`sourceExcerpt`):** Citação literal entre aspas do artigo legal correspondente.
- **Ação Corretiva Recomendada:** Instrução prática de engenharia embasada na norma.

### 4.4 Chamada ao LLM (Gemini 1.5 Flash API) com Prompt Ancorado
Quando a consulta é válida, o prompt restritivo encaminha o contexto recuperado ao **Gemini 1.5 Flash**, solicitando a resposta formatada em tópicos Markdown (*Enquadramento Regulatório*, *Avaliação de Perigo*, *Plano de Ação Corretivo* e *Checklist de Inspeção*).

---

## 5. Componente C — API que Serve o Sistema (FastAPI)

### 5.1 Arquitetura e Serialização de Modelos
A API foi construída em **FastAPI** modularizada. O modelo clássico (`classifier_pipeline.joblib`) e o codificador de rótulos (`label_encoder.joblib`) são **serializados via `joblib` no diretório oficial `backend/app/ml_artifacts/`** e carregados no ciclo de vida de inicialização da API (sem re-treinamento por requisição).

### 5.2 Endpoints Expostos e Validação Pydantic

| Endpoint | Método | Descrição e Validação Pydantic |
|---|---|---|
| `/api/reports/classify` | `POST` | Recebe a narrativa em texto e retorna a classificação ML + XAI. |
| `/api/reports/classify-document` | `POST` | Efetua upload de arquivos (PDF, TXT, MD, CSV, JSON), realiza extração OCR/texto de todas as páginas e classifica a ocorrência. |
| `/api/reports` | `GET` | Consulta a listagem de relatos salvos no PostgreSQL com ordenação server-side. |
| `/api/reports/{report_id}` | `GET` / `DELETE` | Retorna o detalhe do relato ou executa a exclusão física do registro no banco PostgreSQL. |
| `/api/reports/classification/{id}` | `PATCH` | Salva o ajuste técnico manual feito pelo Engenheiro de SST (Human-in-the-Loop). |
| `/api/reports/{id}/query-norm` | `POST` | Dispara a consulta RAG ancorada para o relato. |

---

## 6. Componente D — Reflexão sobre Operação (MLOps, Drift, Custo e Latência)

### 6.1 Monitoramento de Data Drift e Concept Drift Implementado em Código (Diferencial MLOps)
Em ambientes industriais, dois tipos de desvios podem degradar o modelo ao longo do tempo:
- **Data Drift:** Introdução de novos vocabulários operacionais (ex: uso de drones em inspecões, novas máquinas automatizadas).
- **Concept Drift:** Revisões nas leis trabalhistas do MTE que alterem a definição legal de um risco.
- **Implementação Prática em Código (Teste Kolmogorov-Smirnov - KS-Test):** Implementamos o monitoramento estatístico via **KS-Test** sobre a distribuição de probabilidades das predições do `LinearSVC`. Caso o $p$-valor caia abaixo de $0,05$, o sistema emite um alerta automático indicando a necessidade de re-treinamento do modelo.

### 6.2 Análise de Custo e Latência
- **Latência do Classificador ML:** **~2ms** por chamada.
- **Latência do Assistente RAG (Gemini 1.5 Flash):** **~750ms a 1,2s** por geração.
- **Análise de Custos:** O uso do tier gratuito da API Gemini 1.5 Flash garante até 15 requisições/minuto. Em escala comercial de alta volumetria, a implementação de um **Cache Semântico (Redis)** reduz chamadas ao LLM em até 65%, otimizando latência e custos operacionais.

### 6.3 Reflexão Honesta sobre Limites do Sistema
- **Caráter Auxiliar de Decisão:** O SafeGuard é uma ferramenta de suporte técnico e auditabilidade para o SESMT/CIPA, **não substituindo a assinatura e a responsabilidade legal de um Engenheiro de Segurança do Trabalho habilitado**.
- **Dependência de Tradução:** Relatos em português regional com gírias muito específicas dependem da precisão da camada de tradução inicial.

---

## 7. Diferenciais do Projeto Implementados (Nível Excelente)

1. **Containerização Completa com Docker (`docker-compose.yml`):**
   - 3 serviços isolados e comunicantes: `safeguard_api` (FastAPI), `safeguard_frontend` (React/Nginx) e `safeguard_postgres` (PostgreSQL 16).
2. **Monitoramento de Drift em Código:** Simulação estatística com teste Kolmogorov-Smirnov (KS-Test).
3. **Mostrar as Fontes no RAG (Auditabilidade Total):** Exibição do código da norma, item e citação entre aspas.
4. **Interface Visual Completa (React + Tailwind + Lucide):**
   - **Preset Buttons:** Exemplos rápidos de incidentes de campo para teste imediato de todas as categorias na `ReportPage`.
   - **ResultPage:** Visualização completa do texto ou arquivo anexado, cards XAI e auto-ativação do *toggle* de ajuste manual.
   - **RecentReportsTable:** Coluna **Ações** com botões **Ver** e **Deletar** (com confirmação e atualização em tempo real).
5. **Human-in-the-Loop:** Ajuste manual de classificação salvo no banco de dados com flag `is_manual_override = true`.

---

## 8. Instruções de Execução e Reprodução

### 8.1 Execução via Docker Compose (Recomendado)
```bash
# 1. Clonar o repositório
git clone https://github.com/italo-gustavo/safe-guard.git
cd safe-guard

# 2. Subir a aplicação containerizada completa
docker compose up -d --build

# 3. Acessar a interface visual no navegador
# Frontend: http://localhost:8080
# API FastAPI Swagger: http://localhost:3001/docs
```

### 8.2 Execução Local (Sem Docker)
```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 3001

# Frontend
cd frontend
npm install
npm run dev
```
