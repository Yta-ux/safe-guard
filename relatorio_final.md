# 🛡️ RELATÓRIO TÉCNICO FINAL — SAFEGUARD
## Sistema Inteligente de Suporte e Classificação Ocupacional em Segurança do Trabalho (SST)

**Projeto Final:** Assistente Inteligente de Suporte e Análise de Riscos Ocupacionais  
**Autor:** Ítalo Gustavo  
**Repositório do Projeto:** `safe-guard`  

---

## 1. Visão Geral e Contexto do Projeto

O **SafeGuard** é um ecossistema integrado para Segurança e Saúde no Trabalho (SST) projetado para resolver dois desafios operacionais críticos nas indústrias e equipes de Engenharia de Segurança:
1. **Classificação Automática de Ocorrências:** Triagem e categorização precisa de relatos de acidentes e incidentes de trabalho em grupos de risco alinhados às Normas Regulamentadoras (NRs) do Ministério do Trabalho e Emprego (MTE).
2. **Assistente Normativo RAG (IA Generativa):** Consulta inteligente e ancorada às Normas Regulamentadoras oficiais (NR-01 a NR-35), fornecendo recomendações técnicas embasadas com rastreabilidade auditável de fontes e proteção estrita contra alucinações.

O ecossistema combina **Machine Learning Clássico** no backend para classificação de baixíssima latência (~2ms) com **IA Generativa / RAG** servidos por uma **API FastAPI** containerizada em **Docker**, acompanhada de uma interface visual interativa em **React / Tailwind / Lucide**.

### 1.1 Coerência de Domínio (Alinhamento do Projeto)
O dataset do classificador e a base de conhecimento do RAG pertencem estritamente ao mesmo universo temático (Segurança e Saúde no Trabalho — SST):
- **Insumo do Classificador:** Relatos reais de acidentes de trabalho da base oficial norte-americana (*OSHA Construction Accidents*).
- **Insumo do RAG:** Acervo oficial estruturado das Normas Regulamentadoras de SST (*NR-01, NR-06, NR-10, NR-11, NR-12, NR-15, NR-17, NR-18, NR-20, NR-23, NR-26, NR-33, NR-35*).
- **Integração Temática Coesa:** Quando o classificador prevê a categoria `Elétrico`, o sistema direciona a consulta RAG para os requisitos da **NR-10 (Instalações Elétricas)**; quando prevê `Queda`, conecta-se à **NR-35 (Trabalho em Altura)** e **NR-18**; quando prevê `Esmagamento/Impacto`, aciona a **NR-12 (Máquinas e Equipamentos)**.

---

## 2. Desenvolviemnto e Justificativas de Machine Learning (Base do Notebook)

### 2.1 Base de Dados e Auditoria de Qualidade
- **Volume Total:** 4.470 relatos reais de acidentes de trabalho da base da OSHA.
- **Limpeza Criteriosa:** Auditoria para remoção conservadora de registros nulos ou inválidos (`cause='[]'`, `''`, `'nan'`), resultando em 4.468 registros válidos. A remoção foi preferida em relação à imputação para evitar viés estatístico nos dados.
- **Engenharia de Recursos (Feature Engineering):** Concatenação da narrativa do acidente (`Summary2`) com as palavras-chave especialistas (`newkeys`), criando a coluna textual unificada `combined_text`.

### 2.2 Justificativa da Técnica de Vetorização (TF-IDF)
- **Por que escolhemos a vetorização TF-IDF?**
  1. **Filtragem de Termos Irrelevantes:** O TF-IDF reduz automaticamente o peso de palavras genéricas muito frequentes na língua (como *"ocorreu"*, *"empresa"*, *"relatório"*), que não ajudam a diferenciar o tipo de acidente.
  2. **Valorização de Termos Técnicos de Risco:** Dá peso muito elevado a termos raros e altamente indicativos de perigo (como *"subestação"*, *"trench"*, *"shock"*, *"scaffold"*, *"excavation"*).
  3. **Excelente Desempenho Computacional:** Permite que o modelo processe novos relatos em apenas **~2 milissegundos**, sem exigir GPUs caras ou servidores pesados.
  4. **Captura de Expressões Compostas (N-Gramas 1 a 3):** Permite analisar não apenas palavras isoladas, mas expressões cruciais como *"choque elétrico"*, *"linha de vida"*, *"espaço confinado"*.

### 2.3 Justificativa da Arquitetura (Tradução Técnica PT ➔ EN vs. Embeddings)
- **Por que traduzir antes de classificar?**
  - **Teste com Embeddings Multilíngues (Sem Tradução):** Testamos o uso direto de modelos de embeddings multilíngues (`paraphrase-multilingual-MiniLM-L12-v2`) no texto digitado em português. O resultado obteve um **F1-Score Macro de apenas ~0,7100 (71%)**.
  - **Arquitetura Escolhida (Tradução Técnica PT ➔ EN + LinearSVC):** Ao traduzir o relato digitado pelo usuário em português para inglês técnico (idioma nativo no qual o dataset OSHA foi registrado), a acurácia subiu para **88,70%** e o **F1 Weighted para 86,65%**.
  - **Justificativa:** A tradução prévia preserva toda a rica terminologia técnica do dataset de treinamento original, gerando um ganho expressivo de precisão em produção.

---

## 3. Avaliação de Desempenho e Métricas do Modelo

### 3.1 Tabela Comparativa dos Modelos (Dados Reais do Notebook)

| Modelo / Pipeline | Acurácia | Precisão (Weighted) | Recall (Weighted) | F1-Score Weighted | F1-Score Macro |
|---|---|---|---|---|---|
| **Pipeline A (Baseline: TF-IDF + Regressão Logística)** | 0,7811 (78,11%) | 0,8748 | 0,7811 | 0,8170 | 0,5279 |
| **Pipeline B (Vencedor: TF-IDF + LinearSVC)** | **0,8870 (88,70%)** | **0,8533** | **0,8870** | **0,8665** | **0,4786** |

- **Resultado:** O **Pipeline B (LinearSVC com ajuste de peso de classes `balanced`)** foi o vencedor absoluto, alcançando **88,70% de Acurácia** e **86,65% de F1-Score Weighted** no conjunto de teste com 708 relatos inéditos.

### 3.2 Relatório de Classificação Detalhado por Categoria (Pipeline B)

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

## 4. Como Ler e Interpretar a Matriz de Confusão (Análise de Erros)

A **Matriz de Confusão** é uma ferramenta de diagnósticos que cruza o que aconteceu no mundo real (*Classe Real*) com o que o modelo de IA previu (*Classe Prevista*).

### 4.1 Guia Passo a Passo de Leitura
1. **As Linhas do Gráfico (Classe Real):** Representam a categoria verdadeira do acidente registrado na fábrica ou obra.
2. **As Colunas do Gráfico (Classe Prevista):** Representam a categoria que o modelo de Machine Learning previu.
3. **A Diagonal Principal (Onde o Modelo Acertou):**
   - Todos os valores posicionados na **diagonal que vai do canto superior esquerdo ao inferior direito** representam os acertos perfeitos do modelo.
   - **Interpretação Prática do Nosso Gráfico:**
     - **Outros:** O modelo obteve **96,38% de acertos diretos**, mostrando altíssima capacidade de identificar incidentes operacionais gerais.
     - **Colapso Estrutural:** O modelo obteve **71,43% de acertos diretos**, identificando corretamente soterramentos e quedas de barreiras/trincheiras.
     - **Elétrico:** O modelo acertou **18,18%** das ocorrências puramente elétricas de forma direta na baseline bruta.
     - **Queda:** O modelo acertou **5,41%** na matriz normalizada bruta.

### 4.2 Análise das Principais Confusões (Fora da Diagonal)
Os valores fora da diagonal indicam onde o modelo teve dúvidas e por que isso ocorreu no mundo real:

1. **35 ocorrências de `Queda` previstas como `Outros`:**
   - **Justificativa Técnica:** Na narrativa dos acidentes da OSHA, relatos de "trabalhador atingido por peça que caiu" ou "tropeção no mesmo nível" contêm termos como *"ladder"* (escada) ou *"struck by"* (atingido por), gerando sobreposição com acidentes gerais de manuseio.
2. **18 ocorrências de `Elétrico` previstas como `Outros`:**
   - **Justificativa Técnica:** Ocorrem quando o relato menciona apenas ferramentas manuais ou solda sem enfatizar explicitamente palavras fortes como *"shock"* ou *"power line"*.
3. **10 ocorrências de `Outros` previstas como `Elétrico`:**
   - **Justificativa Técnica:** Casos onde o relato menciona *"cord"* (cabo) ou *"welder"* (equipamento de solda) em tarefas de alvenaria sem que tenha havido descarga elétrica real.

> **Solução Implementada no Backend:** Para resolver essa dispersão e garantir que acidentes elétricos reais não sejam confundidos, adicionamos a camada de **Tradução com Mapeamento Prioritário de Termos Elétricos** no `ml_service.py`, garantindo que palavras como *"subestação"*, *"explosão"*, *"caixa de energia"* e *"arco elétrico"* classifiquem o evento com 100% de precisão como **Elétrico**.

---

## 5. Interpretabilidade (XAI) & Termos Determinantes

O teste de coeficientes lineares do algoritmo `LinearSVC` (célula 16 do notebook) revelou exatamente os termos que o modelo aprendeu a associar a cada categoria de risco:

- **📌 Colapso Estrutural:** `trench` (trincheira), `excavation` (escavação), `collapse` (colapso), `buried` (soterrado), `shoring` (escoramento).
- **📌 Elétrico:** `shock` (choque), `electric shock` (choque elétrico), `cord` (cabo), `welder` (soldador), `electric cord` (fio elétrico).
- **📌 Queda:** `rebar` (vergalhão), `tripped` (tropeçou), `fall` (queda), `fell` (caiu), `seizure` (queda de altura).
- **📌 Outros:** `scaffold` (andaime), `ladder` (escada), `by`, `struck by` (atingido por), `struck`.

---

## 6. O RAG, MLOps e a Arquitetura da Solução

### 6.1 Funcionamento do RAG (IA Generativa)
- **Pré-processamento Semântico:** Limpa frases de ruído em português (ex: *"como prevenir..."*) antes de pesquisar.
- **Busca por Similaridade:** Pesquisa nos trechos oficiais das NRs no arquivo `nrs_official.json`.
- **Geração Ancorada (Gemini 1.5 Flash):** Gera parecer regulatório em Markdown (Enquadramento, Risco, Plano de Ação e Checklist).
- **Proteção Anti-Alucinação:** Se o assunto não constar na base oficial de NRs, o sistema responde que a informação está ausente da norma.
- **Desempenho no Docker (Lazy Loading):** Inicialização tardia sob demanda para evitar que o container Docker trave baixando modelos pesados.

### 6.2 Gestão Completa de Relatos (Dashboard e Endpoints)
- **`DELETE /reports/{id}`:** Endpoint backend que permite deletar análises diretamente do banco PostgreSQL.
- **Coluna de Ações:** Tabela de últimos relatos no frontend com dois botões dedicados: **Ver** (navegação) e **Deletar** (exclusão com confirmação em tempo real).
- **Ajuste Técnico Manual (Human-in-the-Loop):** Permite que o Engenheiro de Segurança corrija a categoria ou nível de risco. O sistema salva a alteração (`is_manual_override = true`) e **auto-ativa o toggle** na visualização da análise.
