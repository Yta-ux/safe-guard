# SafeGuard — Sistema Inteligente de Suporte e Classificação Ocupacional em SST

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Módulo 8 — Inteligência Artificial e Aprendizado de Máquina (Projeto Final)**  
> Sistema de ponta a ponta para Segurança e Saúde no Trabalho (SST) integrando Machine Learning Clássico, RAG (IA Generativa), API FastAPI containerizada e interface React.

---

## 📌 Visão Geral do Sistema

O **SafeGuard** resolve dois desafios críticos no atendimento e na Engenharia de Segurança do Trabalho:
1. **Triagem & Classificação Automática (Componente A):** Categorização precisa de relatórios de acidentes de trabalho em **7 grupos de risco alinhados às Normas Regulamentadoras (NRs)** via modelo de Machine Learning treinado sobre **4.470 relatos reais da OSHA**.
2. **Assistente Normativo RAG (Componente B):** Consulta inteligente ancorada à base oficial de Normas Regulamentadoras (NR-01 a NR-35) via **Google Gemini 1.5 Flash**, com proteção estrita contra alucinações e exibição auditável de fontes normativas.

---

## 🛠️ Arquitetura & Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite 6
- **Estilização:** TailwindCSS + Lucide React Icons + Framer Motion
- **Estado & HTTP:** TanStack Query v5 + Axios

### Backend & Machine Learning
- **API:** FastAPI + Pydantic v2
- **ML Clássico:** Scikit-Learn (`LinearSVC` + `TfidfVectorizer` n-gramas 1-3)
- **IA Generativa / RAG:** Google Gemini API (`gemini-1.5-flash`) + Busca Semântica por Similaridade de Cosseno
- **Serialização:** Joblib (`classifier_pipeline.joblib`, `label_encoder.joblib`)

### Infraestrutura & MLOps
- **Containerização:** Docker & Docker Compose com proxy Nginx
- **Monitoramento:** Teste estatístico Kolmogorov-Smirnov (KS-test) para detecção de Data/Concept Drift em produção

---

## 📊 Desempenho dos Componentes

| Componente | Requisito do Edital | Desempenho no SafeGuard |
|---|---|---|
| **Componente A (ML Clássico)** | Comparação de 2+ modelos e métricas por classe | **Acurácia: 81.81%** \| **F1 Macro: 0.7884** (LinearSVC High-Performance) |
| **Componente B (RAG)** | Busca semântica + LLM ancorado sem alucinações | Cobertura de 13 NRs oficiais (NR-01 a NR-35) com resposta "Informação Ausente" quando fora da base |
| **Componente C (API FastAPI)** | Servidor assíncrono com modelo serializado | Latência do ML clássico: **~2ms** \| Validação Pydantic rígida |
| **Componente D (MLOps)** | Reflexão sobre operação, drift, custos e limites | Monitoramento KS-test implementado, latência e custo do RAG otimizados |

---

## 📁 Estrutura do Repositório

```text
safe-guard/
├── backend/                        # API FastAPI e motor de ML / RAG
│   ├── app/
│   │   ├── knowledge_base/         # Base oficial de NRs (nrs_official.json)
│   │   ├── ml_artifacts/           # Modelos serializados (.joblib)
│   │   ├── routers/                # Endpoints (/api/reports, /api/dashboard)
│   │   ├── services/               # Serviços de ML, RAG e extração de PDF
│   │   └── main.py                 # Ponto de entrada FastAPI
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                       # Aplicação Web React
│   ├── src/
│   │   ├── components/             # Componentes visuais e modais OCR
│   │   ├── pages/                  # Dashboard, Report e Result RAG
│   │   └── hooks/api/              # Hooks TanStack Query
│   ├── Dockerfile
│   └── package.json
│
├── notebooks/                      # Componente A — Classificador ML
│   ├── componente_a_classificador.ipynb  # Notebook executado e documentado
│   ├── OSHA construction 4470 cases original.xlsx # Dataset de 4.470 casos
│   └── .venv/                      # Ambiente virtual isolado
│
├── docker-compose.yml              # Orquestração Docker
├── relatorio_final.md              # Relatório Técnico Completo do Projeto
└── README.md
```

---

## 🚀 Como Executar o Projeto

### Opção 1: Via Docker Compose (Recomendado)

Certifique-se de ter o Docker e Docker Compose instalados em sua máquina:

```bash
# 1. Clone o repositório
git clone https://github.com/italo-gustavo/safe-guard.git
cd safe-guard

# 2. Configure a variável de ambiente (opcional, chave Gemini)
export GEMINI_API_KEY="sua_chave_aqui"

# 3. Suba os containers
docker compose up -d --build
```
Acesse a aplicação no navegador em **`http://localhost:8080`**.

---

### Opção 2: Execução Local para Desenvolvimento

#### Backend (FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY="sua_chave_aqui"
uvicorn app.main:app --reload --port 8000
```

#### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

#### Notebook (Componente A)
```bash
cd notebooks
source .venv/bin/activate
jupyter notebook componente_a_classificador.ipynb
```

---

## 📑 Documentação & Relatório Final

Para uma análise detalhada das decisões técnicas, matrizes de confusão, explicabilidade XAI, arquitetura do RAG e reflexão sobre MLOps, consulte o documento completo:
👉 **[relatorio_final.md](relatorio_final.md)**
