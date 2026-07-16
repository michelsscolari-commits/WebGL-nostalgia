# Catálogo de Novas Ideias de Projetos para Michel — Procurement, Meta-IA e Pessoal (2026)

## TL;DR
- **26 novas ideias numeradas (11–36)**, todas distintas das 8 já na fila, das quais **18 são construíveis dentro da restrição do GPO** (HTML de arquivo único, browser-only) e prontas para uso NO trabalho; as demais exigem o ambiente pessoal com Claude Code. Todas ancoradas em técnicas reais de supply chain analytics, no ecossistema Claude Code 2025–2026 e no perfil dele.
- **As três com melhor custo-benefício** são: scorecard de fornecedores OTIF/fill-rate/lead-time (nº 11), o pacote MCP que liga Claude Code ao Athena+Obsidian+Excel (nº 28) e o otimizador de transferências entre os dois CDs (nº 15) — cada uma ataca uma dor recorrente e reaproveita os padrões que ele já domina.
- O maior ganho estratégico vem de **combinar ideias novas com as 8 da fila**: previsão leve (nº 13) alimenta o tracker de excessos (item 4) e o simulador de reposição (nº 16); o scorecard (nº 11) abastece o simulador de negociação (item 5); e o pacote MCP (nº 28) reduz tokens em todos os builds futuros.

## Key Findings

**O stack atual dele é ideal para browser-side analytics.** Previsão de demanda, sazonalidade, scorecards, análise de margem e simuladores de reposição rodam bem 100% no navegador com Web Workers + ECharts, sem violar o GPO. Bibliotecas maduras existem (ARIMA/SARIMA em WASM, TensorFlow.js, ELM em JS puro), mas para o caso dele o mais robusto é implementar métodos estatísticos clássicos diretamente em JS: médias móveis, suavização exponencial (Holt-Winters para sazonalidade) e **Croston/SBA/TSB para itens intermitentes** — que dominam a cauda de SKUs de farmácia (estudos mostram que Croston e variantes superam média móvel e suavização simples em nível de serviço para slow movers).

**Panvel/Dimed opera em escala que justifica cada ferramenta.** Segundo o balanço 4T25 do Grupo Panvel/Dimed (PNVL3), o grupo fechou 2025 com **659 lojas em operação e receita bruta de ~R$ 5,94 bilhões**; a meta oficial de RI para 2030 é **950 a 1.000 lojas, receita entre R$ 11,5 bi e R$ 12 bi e margem EBITDA entre 6,7% e 7%**. São mais de 16.000 SKUs no mix, com a marca própria somando **mais de 1.200 SKUs ativos e 310 lançamentos em 2025** (release 4T25). Os dois CDs — Eldorado do Sul/RS (capacidade de 1 milhão de unidades/dia após expansão de R$ 30 mi) [Tecnologistica](https://www.tecnologistica.com.br/noticias/estrutura/16796/ampliacao-do-centro-de-distribuicao-do-grupo-panvel-em-eldorado-do-sul-e-inaugurado/) e São José dos Pinhais/PR (16.000 m², 19.000 SKUs) [Tecnologistica](https://www.tecnologistica.com.br/br/noticias/estrutura/13837/rede-de-farmacias-panvel-inaugura-centro-de-distribuicao-em-sao-jose-dos-pinhais/) [Giro News](https://gironews.com/farma-cosmeticos/panvel-em-expansao-62729/) — servem regiões distintas, o que torna a otimização de transferências e o balanceamento de estoque entre eles um problema real e valioso.

**A sazonalidade brasileira é forte e datável — ideal para módulos de alerta antecipado.** Protetor solar e repelentes disparam no verão (dez–fev; a Johnson & Johnson estima pico de consumo ~28% acima da média e vendas diárias até 5x — estimativa de trade, não auditada); gripe/resfriado, xaropes e vitaminas sobem no inverno (abr–ago), com a campanha nacional de vacinação da gripe começando em abril [CNN Brasil](https://www.cnnbrasil.com.br/saude/vacina-da-gripe-2025-saiba-tudo-sobre-campanha-deste-ano/) e o Dia D em maio (em 2025, 10/05); a epidemia de dengue de 2024 (**6.484.890 casos prováveis e 5.972 mortes**, segundo o Painel de Arboviroses do Ministério da Saúde) puxou repelentes. O reajuste anual da CMED entra em vigor em 1º de abril todo ano (**2025: 2,60%–5,06%, média 3,83%, o menor desde 2018**; **2026: 1,9%–4,6% por nível de concorrência**, conforme o CFF), criando uma janela de antecipação de compras em março.

**O ecossistema Claude Code amadureceu muito em 2025–2026.** Skills (folders SKILL.md com carregamento sob demanda / progressive disclosure), subagents, hooks (PreToolUse/PostToolUse), plugins (bundles instaláveis) e MCP servers abrem várias automações meta. Há MCP server pronto para AWS Athena (run_query/list_tables/describe_table) e vários para Obsidian, além da skill nativa de Excel do Claude. Para economia de tokens, a skill comunitária **Caveman reduz em média 65% os output tokens (faixa 22–87%)** e a sub-skill /caveman-compress corta ~46% dos input tokens em cada sessão futura. O **Claude Cowork** (agente para knowledge work, roda tarefas agendadas remotamente sem laptop ligado) permite briefings recorrentes.

## Details

### CATEGORIA A — TRABALHO (PANVEL): Procurement & Supply Chain Analytics

---

**11. FornecedorScore — Scorecard HTML de fornecedores (OTIF / Fill Rate / Lead Time / PPV)**
Dashboard de arquivo único que ingere CSV do Athena (pedidos, recebimentos, datas prometidas x reais, quantidades) e calcula por fornecedor: OTIF (on-time AND in-full, lógica estrita), fill rate, lead time médio e variabilidade (desvio-padrão), PPV (price variance) e um índice composto ponderado (SPI) normalizado 0–100. Ranking, semáforo por threshold (95%+ = classe mundial; <85% = plano de ação) e drill-down por SKU.
- **Por que ajuda ele:** transforma as negociações e a gestão de fornecedores dele em algo fact-based; alimenta diretamente o simulador de negociação (item 5 da fila).
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** CSV do Athena com pedidos e recebimentos; definição de janela de entrega aceita.
- **Riscos:** ERP pode marcar entregas parciais como "cumpridas" — tratar a linha de pedido corretamente; padronizar unidade (linha de pedido x pedido). OTIF é o "AND" estrito: 93% on-time e 91% in-full ≈ 85% OTIF, não 93%.

**12. Curva ABC-XYZ Dinâmica Multicritério**
Ferramenta que roda ABC (contribuição de margem/receita) cruzada com XYZ (variabilidade de demanda: X estável, Y sazonal, Z errático) [Cleverence](https://www.cleverence.com/articles/for-business/inventory-stock-levels-5842/) e permite pesos multicritério (margem, criticidade, shelf-life, ruptura). Gera matriz 3x3 com política sugerida por célula (AX = controle apertado e revisão frequente; CZ = buffer maior, regra simples). Recalcula a cada upload de CSV.
- **Por que ajuda ele:** ele já trabalha curva ABC; adicionar o eixo XYZ e multicritério moderniza a segmentação e direciona onde vale esforço analítico.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** histórico de vendas por SKU (12+ meses), margem por SKU.
- **Riscos:** correlação volume↔previsibilidade nem sempre existe; [Medium](https://nicolas-vandeput.medium.com/inventory-optimization-5-ways-to-set-service-level-and-safety-stock-targets-cc3a9a5f44b) não assumir que item A é sempre fácil de prever. ABC/XYZ tem só 2 eixos — por isso a camada multicritério.

**13. Previsão de Demanda Leve no Browser (Holt-Winters + Croston/SBA/TSB)**
Motor de forecast em Web Worker: Holt-Winters (nível+tendência+sazonalidade) para itens regulares e **Croston / SBA / TSB para itens intermitentes** (a cauda de farmácia). Entrada CSV de vendas; saída forecast por SKU com intervalo, MASE/bias, e flag do método escolhido automaticamente por padrão de demanda.
- **Por que ajuda ele:** previsão é insumo de cobertura, DDV, reposição e prevenção de ruptura; feito browser-side respeita o GPO. Alimenta o tracker de excessos (item 4) e o simulador de reposição (nº 16).
- **Esforço:** pesado · **Tokens:** alto · **GPO:** ✅ browser-only.
- **Pré-requisitos:** série histórica limpa por SKU; binning temporal consistente.
- **Riscos:** métricas de erro por período são inadequadas para demanda intermitente [ResearchGate](https://www.researchgate.net/publication/254044245_A_Review_of_Croston's_method_for_intermittent_demand_forecasting) — usar service level / stock implications; obsolescência é risco real em slow movers.

**14. Radar de Sazonalidade & Eventos (calendário BR pharma)**
Painel que sobrepõe curva de vendas por categoria a um calendário parametrizável de eventos brasileiros: verão (protetor solar, repelente, pós-sol), inverno (gripe, xarope, vitaminas), campanha de vacinação da gripe (abril/Dia D em maio), temporada de dengue, datas comerciais (Mães, Pais, Black Friday, Natal) e reajuste CMED (1º abril). Gera alertas de "prepare estoque em T-X semanas".
- **Por que ajuda ele:** antecipa picos sazonais concretos da farmácia BR e a janela de compra pré-CMED, evitando ruptura e excesso.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** vendas históricas por categoria; tabela de eventos (fornecida uma vez).
- **Riscos:** eventos climáticos (dengue) variam ano a ano; tratar como probabilístico, não determinístico.

**15. OtimizaCD — Balanceador de Transferências entre CD 1017 (RS) e CD 1021 (PR)**
Simulador que compara cobertura/DDV por SKU nos dois CDs e sugere transferências para equalizar risco de ruptura x excesso, considerando lead time entre CDs, custo de transferência e demanda regional. Lógica multi-echelon simplificada (pooling: buffer central x buffer local; safety stock por echelon com Z diferenciado). Saída: lista priorizada de transferências com impacto em R$.
- **Por que ajuda ele:** os dois CDs servem regiões distintas (RS/SC vs SP/PR/SC); rebalancear reduz excesso (base de ~R$27,7M do item 4) e ruptura simultaneamente.
- **Esforço:** pesado · **Tokens:** alto · **GPO:** ✅ browser-only.
- **Pré-requisitos:** estoque e demanda por SKU por CD; lead time e custo de transferência inter-CD.
- **Riscos:** dados de demanda regional precisam ser confiáveis; risco de "bola de pingue-pongue" (transferir e depois transferir de volta) — travar com histerese.

**16. Simulador de Parâmetros de Reposição (ROP / Safety Stock / EOQ)**
Calculadora interativa: o usuário ajusta service level (Z), lead time, variabilidade de demanda e vê ROP = μD·L + Z·σD·√L, [arxiv](https://arxiv.org/pdf/2511.23366) safety stock, EOQ e cobertura resultante em tempo real, com gráfico de trade-off nível de serviço x capital imobilizado. Presets por classe ABC/XYZ (A/X: 95–99%; C/Z: heurística com teto).
- **Por que ajuda ele:** conecta teoria de estoque à rotina de cobertura/DDV; é um "laboratório" para calibrar políticas antes de aplicar no ERP.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** σ de demanda e lead time por SKU/classe.
- **Riscos:** modelo normal subestima cauda direita [ISM](https://www.ism.ws/logistics/safety-stock-formula/) em itens de baixo giro; oferecer opção Poisson/Gamma para intermitentes. [ISM](https://www.ism.ws/logistics/safety-stock-formula/)

**17. GestValidade — Monitor de Shelf-Life / FEFO com alertas escalonados**
Ferramenta que ingere lotes com data de validade e aplica lógica FEFO, com thresholds escalonados (ex.: 90 dias = planejamento promocional; 30 dias = decisão de markdown; 7 dias = disposição). [BoxWise](https://boxwise.io/blog/fefo-inventory-management/) Prioriza por valor em risco (R$) e sugere ação. Dashboard de "valor bloqueado por proximidade de validade".
- **Por que ajuda ele:** medicamentos têm shelf-life médio 24–36 meses; reduzir write-offs e markdowns de última hora protege margem — dor direta de quem gere excessos/DGA.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** dados de lote/validade por SKU (nem sempre no mesmo dataset — verificar no Athena).
- **Riscos:** se o dado de lote não existir no Athena, a ideia perde força — validar disponibilidade antes.

**18. Análise de Margem & Mix (bridge de margem blended)**
Painel que decompõe a variação da margem bruta blended em três forças: mix de categoria, mix dentro da categoria e mix promocional [Chaptersdata](https://www.chaptersdata.com/blog/margin-mix-analytics-product-blend-guide/) (simulação de mix constante x real). Ranking de SKUs por margem-R$ contribuída (não por volume). Flag de "categoria que só vende promocionada".
- **Por que ajuda ele:** margem de farmácia varia muito conforme mix (genérico x referência x HB x dermocosmético); explicar POR QUE a margem mexeu é insight de alto valor para negociação e pricing. Análises de mix mostram que 30–50% do movimento de margem vem de mix, não de preço/custo.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** vendas, COGS e categoria por SKU.
- **Riscos:** reembolso/PBM e shrinkage não aparecem no cálculo simples de margem [Chaptersdata](https://www.chaptersdata.com/blog/margin-mix-analytics-product-blend-guide/) — anotar limitação.

**19. Preparador de Negociação com Should-Cost & TCO**
Ferramenta que monta, por fornecedor/categoria, um modelo should-cost (matéria-prima + mão de obra + overhead + margem-alvo) [Precoro](https://precoro.com/blog/should-cost-model-how-to-build-calculate-and-negotiate/) e um comparativo de TCO (preço + defeitos + atrasos + frete + rework), gerando um "target price" e argumentos estruturados para a mesa. Integra dados do scorecard (nº 11).
- **Por que ajuda ele:** dá base factual às negociações (ancoragem em custo, não em preço arbitrário); [Galorath](https://galorath.com/cost/should-cost-analysis/) complementa o simulador de cenários (item 5).
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** estrutura de custo estimada ou benchmarks; histórico de preço e performance.
- **Riscos:** should-cost exige premissas de custo que podem ser difíceis de obter — permitir entrada manual e cenários.

**20. Scorecard de RFP / RFQ ponderado**
Ferramenta de avaliação estruturada de propostas: critérios ponderados (preço, prazo, qualidade, compliance, escalabilidade), normalização 0–100, "killer criteria" (compliance/segurança como hard-fail que sobrepõe o score), e ranking transparente com rationale. Exporta resumo copy-paste-ready.
- **Por que ajuda ele:** padroniza e desubjetiva a seleção de fornecedores em processos de RFP; auditável e reutilizável.
- **Esforço:** rápido · **Tokens:** baixo · **GPO:** ✅ browser-only.
- **Pré-requisitos:** critérios e pesos definidos.
- **Riscos:** pesos mal calibrados distorcem resultado; documentar a metodologia.

**21. Detector de Anomalias de Estoque & DGA (regras + z-score)**
Painel que varre o CSV diário/semanal e sinaliza anomalias: quedas/saltos bruscos de venda, cobertura fora de faixa, itens em curva A próximos de ruptura, excessos crescentes (DGA), e divergências de custo. Usa regras + z-score simples (sem ML pesado). Heat map de exceções priorizado por R$.
- **Por que ajuda ele:** vira o "primeiro olhar" diário automatizado; conecta ao módulo de alertas (item 3) e ao relatório semanal (item 2).
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** extração diária/semanal do Athena.
- **Riscos:** excesso de falsos positivos cansa o usuário — calibrar thresholds e permitir silenciar.

**22. Prevenção de Ruptura em Curva A (watchlist ativa)**
Ferramenta focada exclusivamente na curva A: projeta dias até ruptura por SKU-A (estoque atual / DDV), cruza com lead time e pedidos em trânsito, e gera watchlist priorizada por perda de venda estimada em R$. Serviço-alvo 95–99% para itens A.
- **Por que ajuda ele:** ruptura em curva A é a que mais dói em venda e imagem; foco cirúrgico onde o retorno é máximo.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** estoque, DDV, lead time, pedidos em trânsito.
- **Riscos:** depende de dado de "em trânsito" confiável.

**23. Biblioteca de Benchmarks & Glossário de KPIs de Supply Chain**
HTML de referência com definições, fórmulas e benchmarks do setor (OTIF 95%+, inventory turnover, DIOH, fill rate, GMROI, perfect order rate, order accuracy 99%+, defeitos <1%), com calculadoras embutidas. Serve de "fonte de verdade" compartilhável com o time.
- **Por que ajuda ele:** padroniza vocabulário e metas; acelera onboarding e alinhamento em reuniões.
- **Esforço:** rápido · **Tokens:** baixo · **GPO:** ✅ browser-only.
- **Pré-requisitos:** nenhum além dos benchmarks (já pesquisados).
- **Riscos:** benchmarks variam por categoria — contextualizar.

**24. Gerador de Queries Athena "Cost-Aware" (browser-side query builder)**
Ferramenta que monta queries Trino/Presto a partir de um formulário e injeta boas práticas de custo automaticamente: filtro de partição obrigatório, SELECT de colunas específicas (nunca SELECT *), [NetCom Learning](https://www.netcomlearning.com/blog/aws-athena) predicados baratos primeiro, [Big Data Boutique](https://bigdataboutique.com/blog/aws-athena-cost-and-performance-optimization-tips-496423) LIMIT em exploração, [NetCom Learning](https://www.netcomlearning.com/blog/aws-athena) aviso de cross join, sugestão de query result reuse. Estima "risco de scan alto". Copy-paste para o console do Athena.
- **Por que ajuda ele:** Athena cobra ~US$5 por TB escaneado; particionar + Parquet + colunas certas reduz scan em 85–99%. Complementa a biblioteca de queries parametrizadas (item 1 da fila).
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** conhecer o particionamento das 96 tabelas (já dossiê no vault).
- **Riscos:** não substitui EXPLAIN [AWS](https://aws.amazon.com/blogs/big-data/top-10-performance-tuning-tips-for-amazon-athena/) — deixar claro que é heurística.

**25. Simulador de Impacto do Reajuste CMED**
Ferramenta que, dado o teto de reajuste CMED por nível de competição (2026: 1,9%–4,6%) e o mix de compras, projeta o impacto em custo e sugere o volume de antecipação de compra em março (pré-1º abril) por SKU/categoria, com trade-off entre economia de reajuste e custo de carrego + risco de validade.
- **Por que ajuda ele:** a janela pré-CMED (1º abril) é o ponto de inflexão de compra do ano no varejo farmacêutico BR; quantificar a antecipação ótima é dinheiro direto.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** classificação CMED por SKU; custo de carrego; shelf-life.
- **Riscos:** reajuste é teto, não obrigatório — cada laboratório decide; modelar como cenário. Nota: a Resolução CMED nº 3/2025 (novo marco de precificação) entra em vigor em abril/2026.

**26. Relatório de Acurácia de Forecast & Bias (loop de melhoria)**
Painel que compara forecast (do nº 13) x realizado e reporta MASE, bias, tracking signal por SKU/categoria ao longo do tempo, sinalizando onde o método precisa mudar (ex.: item ficou intermitente). Fecha o loop de melhoria contínua.
- **Por que ajuda ele:** forecast sem medição de erro é fé; este item disciplina a previsão e justifica ajustes de política.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** histórico de forecasts salvos + realizado.
- **Riscos:** exige persistir forecasts anteriores (localStorage ou CSV versionado).

### CATEGORIA B — META (IA & CLAUDE CODE): Produtividade e Pipelines de Conhecimento

---

**27. Pacote de Skills "Panvel Invariants" (SKILL.md)**
Conjunto de skills folder-based codificando os invariantes dele: design tokens fixos (fundo #0a0e1a; acentos #61a5ff/#67e8f9/#55e6b3/#f6c35b/#fb7185; Space Grotesk/Inter/JetBrains Mono), contrato postMessage de filtro global, padrão de blob Base64, karpathy-guidelines de edição cirúrgica, PRD-first com sign-off, reversibilidade. Carregam sob demanda (progressive disclosure), economizando contexto. [Suprmind](https://suprmind.ai/hub/claude/features/)
- **Por que ajuda ele:** cada sessão futura não precisa re-explicar os padrões; a skill é o "playbook" reutilizável. [Totalum](https://www.totalum.app/blog/claude-code-skills-totalum) Complementa o item 6 da fila, indo além ao empacotar como skills auto-invocáveis + plugin distribuível.
- **Esforço:** médio · **Tokens:** médio · **Ambiente:** 🖥️ Claude Code pessoal.
- **Pré-requisitos:** documentação dos invariantes (já existe informalmente).
- **Riscos:** skills demais poluem contexto [Claude Code Docs](https://code.claude.com/docs/en/features-overview) — manter enxutas e bem descritas.

**28. MCP Bridge: Athena + Obsidian + Excel no Claude Code pessoal**
Configuração de MCP servers no ambiente pessoal: AWS Athena MCP (run_query/ [MCP Market](https://mcpmarket.com/server/aws-athena) list_tables/describe_table via uvx/npx), um MCP de Obsidian para o vault Super-Cérebro, e a skill nativa de Excel do Claude. Assim o Claude Code consulta o Athena, lê/escreve no vault e manipula planilhas sem copy-paste manual.
- **Por que ajuda ele:** elimina o atrito entre as camadas dele (Athena/AWS, Obsidian, Excel); prototipa queries e dossiês em casa e leva o HTML pronto para o trabalho.
- **Esforço:** médio · **Tokens:** baixo (setup) · **Ambiente:** 🖥️ Claude Code pessoal.
- **Pré-requisitos:** credenciais AWS (IAM), Node/uvx, vault acessível, bucket S3 de output do Athena.
- **Riscos:** segurança de credenciais (usar IAM role/assume-role, não chaves longas); MCP consome tokens de schema — controlar overhead.

**29. Hooks de Disciplina & Reversibilidade**
Hooks PreToolUse/PostToolUse no Claude Code que impõem os invariantes por código (não por confiança no modelo): bloquear ações destrutivas sem backup, forçar checkpoint antes de editar blobs, logar toda edição, validar que design tokens não foram alterados.
- **Por que ajuda ele:** ele já pratica reversibilidade e edição cirúrgica; hooks tornam isso determinístico e à prova de alucinação (executam código, não interpretam instrução).
- **Esforço:** rápido · **Tokens:** baixo · **Ambiente:** 🖥️ Claude Code pessoal.
- **Pré-requisitos:** scripts shell simples.
- **Riscos:** hooks mal escritos podem travar o fluxo — testar isoladamente.

**30. Skill de Compressão de Contexto / Economia de Tokens**
Adotar/adaptar a skill Caveman (média de 65% de redução de output tokens, faixa 22–87%) + o /caveman-compress no CLAUDE.md (~46% de input tokens economizados por sessão), medindo economia por sessão. Roteamento de modelo (Haiku para exploração/subagents, Opus para arquitetura). [Blake Crosley](https://blakecrosley.com/guides/claude-code)
- **Por que ajuda ele:** ele usa autonomia total com subagents paralelos — economia de tokens escala com o volume de sessões; ganho maior em sessões multi-turn (prompt cache).
- **Esforço:** rápido · **Tokens:** baixo · **Ambiente:** 🖥️ Claude Code pessoal.
- **Pré-requisitos:** nenhum.
- **Riscos:** compressão agressiva pode prejudicar explicações longas [Firecrawl](https://www.firecrawl.dev/blog/best-claude-code-skills) — usar seletivamente; pouco útil em prompts one-shot.

**31. Rotina Cowork Agendada: Briefing Diário/Semanal de Supply Chain**
Usar Claude Cowork (roda tarefas agendadas remotamente, sem laptop ligado) [VentureBeat](https://venturebeat.com/technology/anthropic-brings-claude-cowork-to-mobile-and-web-as-usage-data-shows-most-users-arent-coding) para gerar um briefing recorrente: lê exports, notícias do setor, e monta um resumo executivo com ações recomendadas. Ex.: toda segunda 6h, um doc de prep da semana pronto para o café.
- **Por que ajuda ele:** automatiza a "connective work" ao redor do papel (categoria dominante de uso do Cowork).
- **Esforço:** rápido · **Tokens:** médio (recorrente) · **Ambiente:** 🖥️ Cowork (plano pago; fora do GPO).
- **Pré-requisitos:** plano Claude com Cowork; conectores de dados.
- **Riscos:** Cowork não roda na máquina do trabalho (GPO); usar no ambiente pessoal; atenção a permissões de arquivo e egress.

**32. Auditor de Saúde do Vault com Edge-Centric Metrics**
Ferramenta (skill + análise) que audita o grafo do Super-Cérebro usando métricas de rede: betweenness centrality, detecção de comunidades, [Infranodus](https://infranodus.com/use-case/visualize-knowledge-graphs-pkm) gaps estruturais (clusters que deveriam se conectar mas não se conectam), [Infranodus](https://infranodus.com/use-case/visualize-knowledge-graphs-pkm) notas órfãs, arestas tipadas mal formadas. Sugere links faltantes e questões de pesquisa que preenchem gaps (estilo InfraNodus/GraphRAG).
- **Por que ajuda ele:** vai além da auditoria de saúde já na fila (item 7), adicionando análise de rede real sobre a arquitetura edge-centric de arestas tipadas e pesadas dele.
- **Esforço:** médio · **Tokens:** médio · **Ambiente:** 🖥️ Claude Code pessoal.
- **Pré-requisitos:** acesso ao vault; índices JSON existentes (surface_index.json, calc_hypotheses.jsonl).
- **Riscos:** grafos grandes (~1.950 notas) podem custar tokens — processar por subgrafos.

**33. Pipeline de Ingestão de Dossiês de Tabelas Athena → Vault**
Automação que, dada uma tabela nova do Athena, gera o dossiê padronizado (schema, colunas, partições, exemplos de query, hipóteses de cálculo) e o insere no vault com arestas tipadas para as notas de cálculo relacionadas, atualizando os índices JSON. Escala os 96 dossiês existentes.
- **Por que ajuda ele:** industrializa a manutenção do Super-Cérebro; cada nova tabela vira conhecimento estruturado e recuperável automaticamente.
- **Esforço:** médio · **Tokens:** médio · **Ambiente:** 🖥️ Claude Code pessoal (usa MCP do nº 28).
- **Pré-requisitos:** nº 28 (MCP Athena+Obsidian); template de dossiê.
- **Riscos:** consistência de arestas tipadas — validar com o auditor (nº 32).

### CATEGORIA C — PESSOAL: Finanças, Produtividade e Aprendizado

---

**34. Painel de Carteira Tesouro Direto (alocação por perfil & marcação a mercado)**
Dashboard HTML que modela a carteira real dele (IPCA+, Prefixado, Selic), mostra alocação atual x alvo por perfil, sensibilidade à marcação a mercado (impacto de mudança de juros no preço de prefixados/ [Seu Dinheiro](https://www.seudinheiro.com/2026/renda-fixa/tesouro-prefixado-ou-tesouro-ipca-o-que-dizem-as-recomendacoes-de-renda-fixa-e-tesouro-direto-para-janeiro-mlim/) IPCA+) e cronograma de vencimentos alinhado à meta 2040. Diferente do simulador de meta (item 8): foco em alocação e risco de MtM, não só na projeção do R$1M.
- **Por que ajuda ele:** complementa o item 8; ajuda a decidir entre liquidez (Selic) e proteção real (IPCA+) [C6 Bank](https://www.c6bank.com.br/blog/tesouro-direto-investir-agora) num cenário de Selic ~14% caindo gradualmente (projeção de mercado ~13% até 2027). Em julho/2026 o IPCA+ 2035 pagava IPCA+8,33% a.a. e o Prefixado 2029 ~14,26% a.a.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only (uso pessoal).
- **Pré-requisitos:** posições atuais; taxas de referência (entrada manual).
- **Riscos:** não é recomendação de investimento — incluir disclaimer; taxas mudam; prefixado tem volatilidade de MtM se vendido antes do vencimento.

**35. Sistema de Aprendizado Contínuo com Spaced Repetition (deck de supply chain / SQL / finanças)**
Ferramenta HTML de flashcards com algoritmo de repetição espaçada (SM-2/FSRS) e active recall, alimentada a partir das notas do Super-Cérebro (uma nota → cards). Decks: fórmulas de estoque, dialeto Trino/Athena, conceitos de renda fixa.
- **Por que ajuda ele:** converte o vault de "arquivo morto" em retenção ativa; reforça o domínio técnico que ele usa no trabalho.
- **Esforço:** médio · **Tokens:** médio · **GPO:** ✅ browser-only.
- **Pré-requisitos:** conteúdo dos cards (pode gerar do vault via Claude Code pessoal).
- **Riscos:** cards "parede de texto" dão ilusão de competência [StudyCards AI](https://studycardsai.com/blog/master-spaced-repetition-5-proven-study-hacks-for-2026) — um fato por card.

**36. Central de Produtividade Pessoal (revisão semanal + metas + hábitos)**
HTML de arquivo único que unifica revisão semanal (estilo GTD), tracking de metas (inclui marco financeiro), e um "action audit" que bloqueia novos scans se ações anteriores não foram tocadas (forcing function anti-busywork). Persistência em localStorage.
- **Por que ajuda ele:** dá um sistema pessoal coeso, no mesmo padrão visual/técnico dos dashboards de trabalho, reaproveitando o design system dele.
- **Esforço:** rápido · **Tokens:** baixo · **GPO:** ✅ browser-only.
- **Pré-requisitos:** nenhum.
- **Riscos:** ferramentas de produtividade morrem por falta de uso — manter mínima e ritualizada.

## Recommendations

**Ranking Top 10 custo-benefício (para o perfil dele):**
1. **Nº 11 FornecedorScore** — dor recorrente (negociação), reaproveita padrões, alimenta item 5. Comece por aqui.
2. **Nº 28 MCP Bridge (Athena+Obsidian+Excel)** — desbloqueia todos os builds futuros; ROI de tempo/tokens altíssimo.
3. **Nº 15 OtimizaCD** — ataca diretamente os R$27,7M de excesso e a ruptura, usando a estrutura de 2 CDs.
4. **Nº 13 Previsão leve (Holt-Winters + Croston)** — insumo central de cobertura, reposição e excessos.
5. **Nº 27 Skills Panvel Invariants** — economiza contexto em cada sessão; multiplica a produtividade com Claude Code.
6. **Nº 14 Radar de Sazonalidade & Eventos** — ganho sazonal concreto (verão/inverno/CMED) com esforço médio.
7. **Nº 24 Query Builder Cost-Aware** — corta custo de Athena e acelera; complementa item 1.
8. **Nº 18 Análise de Margem & Mix** — insight de alto valor para pricing/negociação, esforço médio.
9. **Nº 30 Skill de compressão de tokens** — economia rápida e permanente.
10. **Nº 34 Painel Tesouro Direto** — alto valor pessoal, baixo esforço, reaproveita design system.

**Sequências sinérgicas sugeridas:**
- **Trilha "Dados → Decisão":** nº 28 (MCP) → nº 24 (query builder) → nº 13 (forecast) → nº 26 (acurácia) → nº 16 (reposição) → nº 15 (transferências). Cada uma alimenta a próxima.
- **Trilha "Fornecedor":** nº 11 (scorecard) → nº 19 (should-cost/TCO) → item 5 da fila (simulador de negociação) → nº 20 (RFP scoring).
- **Trilha "Estoque saudável":** nº 12 (ABC-XYZ) → nº 22 (ruptura curva A) + nº 17 (validade) → item 4 da fila (tracker de excessos) → nº 21 (anomalias) → item 2/3 (relatório semanal + alertas).
- **Trilha "Cérebro":** nº 27 (skills) + nº 29 (hooks) → nº 33 (ingestão de dossiês) → nº 32 (auditoria de grafo, estende item 7) → nº 35 (spaced repetition).

**Benchmarks/thresholds que mudam a priorização:**
- Se o dado de **lote/validade não existir no Athena**, despriorize nº 17 e nº 25.
- Se **OTIF dos fornecedores já estiver >95%** consistentemente, o nº 11 vira monitoramento (menor urgência) e o foco vai para margem (nº 18).
- Se o **volume de sessões Claude Code for alto**, suba nº 30 (compressão) e nº 27 (skills) no ranking.
- Se a **janela pré-CMED (março)** estiver próxima, o nº 25 e nº 14 ganham urgência sazonal.

## Caveats
- **Restrição GPO é dura:** todos os itens marcados ✅ são HTML de arquivo único, sem backend; os itens 🖥️ (27–33, exceto onde indicado) exigem o ambiente pessoal e produzem artefatos que ele leva prontos para o trabalho. O Cowork (nº 31) não roda na máquina do trabalho.
- **Ideias despriorizadas respeitadas:** nenhuma proposta de bolão ou vídeo de mascotes.
- **Números de mercado com data:** os parâmetros da CMED 2026 (1,9%–4,6%) e taxas do Tesouro (IPCA+ ~8,3% em julho/2026) são datados e mudam; tratar como referência, não fixos. Estimativas de "spike" sazonal (protetor solar +28%/5x, Johnson & Johnson) vêm de fontes de trade/marketing, não auditadas.
- **Previsão intermitente:** métricas de erro por período são inadequadas — usar service level; obsolescência é risco real em slow movers.
- **Escopo de dados:** várias ideias assumem disponibilidade de campos no Athena (lead time real, pedidos em trânsito, lote/validade, custo de transferência inter-CD). Validar disponibilidade antes de investir esforço pesado.
- **Discrepância de fonte:** materiais corporativos atuais da Panvel listam 2 CDs; artigos de logística de 2021–2022 mencionam um possível 3º CD em Passo Fundo/RS — verificar antes de assumir.
