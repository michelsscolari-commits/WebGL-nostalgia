# Memória do Projeto — WebGL Premium Nostalgia Tech

Atualizado em 2026-07-14. Estado: **v0.1 publicada e validada em produção**.

## Produção

- GitHub público: `https://github.com/michelsscolari-commits/WebGL-nostalgia`
- Produção: `https://webgl-nostalgia.vercel.app`
- Projeto Vercel: `michelscolari/webgl-nostalgia`, Node.js 24.x.
- Configuração persistente: Vite, `npm ci`, `npm run build`, saída `dist`.
- Deploy `dpl_HT9zLoiBLDTT5qcQZ3vWZLJFRfTM`, estado `READY` em 2026-07-14.
- Integração automática GitHub→Vercel pendente: o GitHub App do Vercel ainda não tem acesso ao novo repositório. Deploy manual pela CLI funciona.

## Intenção que não deve se perder

O projeto é uma arqueologia elétrica, não uma coleção de telas retrô. A matéria visual precisa parecer a mesma energia se reorganizando durante todo o scroll. Não introduzir espaço, estrelas, planetas, cards neon, emulação literal ou cortes entre cenas.

## Invariantes técnicos

- Um único Canvas R3F persistente.
- Uma população determinística de partículas e uma topologia determinística de filamentos por tier.
- Transformações por morph entre estados adjacentes; não montar/desmontar cenas por capítulo.
- Texto, navegação e controles continuam semânticos no DOM.
- Qualidade visual, movimento ambiente e interação direta são políticas separadas.
- Pausa explícita congela relógio, ponteiro, câmera e framebuffer; `prefers-reduced-motion` ainda aceita gesto direto sutil.
- WebGL 2 é o mínimo do Three.js atual. WebGL 1 deve cair no fallback CSS.
- Nunca esconder a narrativa por falha ou perda do contexto gráfico.

## Arquitetura da v0.1

O progresso visual é ancorado no centro de cada seção editorial. `App.tsx` suaviza scroll e velocidade, mantém o relógio visual e publica apenas telemetria de baixa frequência no React. `PhosphorField.tsx` atualiza uniforms em refs, sem rerender por frame. Os shaders interpolam sete alvos gerados de forma determinística. `VisualSystem.tsx` mantém Canvas, câmera, pós-processamento, perda/restauração de contexto e boundary de falha.

## Aprendizados reutilizáveis

1. **Timeline precisa seguir os capítulos reais.** Percentual bruto do documento desalinha narrativa e morph quando seções têm alturas diferentes. Interpolar entre âncoras dos centros mantém texto e estado visual sincronizados.
2. **Relógio de apresentação não é delta de física.** O tempo visível avança com o elapsed real; apenas integrações de velocidade usam delta limitado. Limitar ambos fez o boot depender do FPS.
3. **Pausa WebGL deve ser provada no framebuffer.** Screenshots do elemento Canvas podem divergir por composição do navegador mesmo com pixels WebGL idênticos. `gl.readPixels` fornece a evidência correta; nesta versão, os fingerprints ficaram idênticos durante a pausa.
4. **Retomada precisa de telemetria do relógio.** Publicar `--visual-time` permitiu provar que o relógio ficou estável na pausa e retomou com um delta normal de frame, sem absorver os 750 ms pausados.
5. **Filamentos contínuos exigem endpoints da mesma função.** Segmentos vizinhos compartilham posição ao derivar os dois endpoints da mesma curva paramétrica e do mesmo índice, mesmo com vértices duplicados em `LineSegments`.
6. **Fallback precisa cobrir capacidade e falha.** Detectar somente WebGL 2, esconder o Canvas enquanto não estiver pronto e capturar erro de montagem evita uma tela preta sobre a composição estática.
7. **Movimento reduzido não significa baixa qualidade.** DPR, partículas e bloom dependem de capacidade; a preferência de movimento altera tempo e interação, não a nitidez estática.
8. **Clipping deve ser medido.** O guardrail de pixels com algum canal acima de 250 ficou entre 0,063% e 0,114%, abaixo do limite de 1%.
9. **Persistir o preset do Vercel.** `vercel deploy` detectou Vite e publicou corretamente, mas `vercel project add` deixou o projeto como `Other`. Sempre conferir com `vercel project inspect` e persistir framework, install, build e output antes de considerar o deploy encerrado.

## Evidência da v0.1

- 7 arquivos de teste / 22 testes unitários aprovados.
- ESLint, TypeScript e build de produção aprovados.
- Desktop 1440×1000, tablet 820×1180 e mobile 390×844: um Canvas, zero overflow e zero erros de console.
- axe-core WCAG A/AA, 2.1 A/AA e 2.2 A/AA: zero violações.
- Primeiro foco por teclado: link “Pular para a narrativa”.
- Controle de movimento: 44 px de altura.
- Movimento normal muda o framebuffer; pausa mantém fingerprints idênticos; retomada não salta o relógio.
- `prefers-reduced-motion`: ponteiro continua alterando o framebuffer.
- Sem WebGL: zero Canvas, fallback visível e narrativa completa.
- Perda/restauração de contexto forçada: Canvas oculto no erro e retorno para `available/ready=true`.
- Produção desktop e mobile: HTTP 200, favicon 200, um Canvas, sete capítulos, zero overflow, zero erro de console e zero request falho.
- Produção usa 56 mil partículas no desktop e 18 mil no mobile; pausa retornou “Movimento pausado” nos dois viewports.

## Riscos e próximos passos

- O bundle 3D é grande por natureza; medir cache e carregamento em hospedagem real antes de adicionar assets.
- R3F 9.6.1 ainda instancia `THREE.Clock`, marcado como deprecated no Three r183+. Isso gera um aviso da dependência, não usa nem afeta o relógio visual próprio. Não silenciar nem patchar `node_modules`; reavaliar quando R3F migrar para `THREE.Timer`.
- O audit headless usa SwiftShader. FPS, temperatura e consumo devem ser medidos em celulares físicos de entrada antes de produção.
- Uma futura camada sonora só deve existir com consentimento explícito, mute persistente e sem autoplay.
- Se surgir um segundo projeto CRT, extrair os alvos e o audit de framebuffer para um módulo compartilhado; por enquanto, a skill central foi evoluída.
- Autorizar `michelsscolari-commits/WebGL-nostalgia` no GitHub App do Vercel e repetir `vercel git connect` para ativar deploy automático por push.
