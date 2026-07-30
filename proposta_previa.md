Proposta Prévia de Projeto Final

Aluno: Ítalo Gustavo
Projeto: SafeGuard

1. Tema e problema

A ideia é a construção de um assistente de apoio para equipes de Segurança e Saúde no Trabalho (SST), que resolve dois problemas: classificar automaticamente relatos de acidentes por tipo de risco, e responder dúvidas técnicas com base nas Normas Regulamentadoras, sem precisar consultar a legislação manualmente de forma básica, com algumas opções prontas para consulta.

2. Modelo clássico e dados

Classificador treinado sobre uma base pública de relatos reais de acidentes de trabalho (dataset OSHA Construction Accidents), comparando pelo menos duas abordagens de ML  para categorizar as ocorrências em grupos de risco.

3. Componente de IA generativa e base

Um RAG construído sobre o texto oficial das Normas Regulamentadoras de SST, que responde perguntas técnicas ancorado nesse conteúdo, indicando a fonte normativa usada e evitando responder algo que não esteja na base.

4. Como as 5 capacidades são atendidas

- ML clássico: duas abordagens comparadas, avaliadas com métricas além da acurácia.
- Interpretabilidade: análise dos erros do modelo e dos fatores que mais pesam nas classificações.
- IA generativa com propósito real: RAG sobre as NRs, resolvendo uma tarefa concreta (dúvida normativa) de forma básica, mas não atua como um chatbot ou algo muito livre para se resolver.
- API funcional: serviço servindo o modelo treinado, com validação de entrada e saída.
- Reflexão sobre operação: comparação de custo/latência entre o classificador e o RAG, e monitoramento de drift nos dados.

5. Origem dos dados

Classificador e RAG estão no mesmo domínio (SST): um trabalha sobre relatos reais de acidentes, o outro sobre a legislação que rege a prevenção desses acidentes — os dois se conectam naturalmente.


[APROVADO] -> DAVYD KAIO SIMÕES