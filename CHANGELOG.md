# Changelog

## 0.1.0 — 2026-07-13

### Publicado em 2026-07-14

- Repositório público: `michelsscolari-commits/WebGL-nostalgia`.
- Produção: `https://webgl-nostalgia.vercel.app`.
- Projeto Vercel fixado em Vite, Node.js 24.x, `npm ci`, `npm run build` e `dist`.
- Validação pública desktop/mobile sem erros, overflow ou requests falhos.

### Adicionado

- Experiência WebGL contínua em sete estados de nostalgia tecnológica.
- 18k/32k/56k partículas e 2k/4k/8k filamentos com identidade estável.
- Shaders próprios de morph, fósforo, raster, persistência e memória do ponteiro.
- Boot POST, scanlines, ruído analógico, vinheta e editorial responsivo.
- Pausa integral, movimento reduzido, detecção WebGL 2, fallback CSS e recuperação de contexto.
- Timeline ancorada nos capítulos e quality tiers por capacidade.
- Testes unitários, auditoria visual Chromium/axe e documentação operacional.

### Corrigido durante a validação

- Boot que avançava mais devagar em FPS baixo por usar delta de física como relógio.
- Estados visuais desalinhados do texto por usar percentual bruto do documento.
- Detecção indevida de WebGL 1 para uma versão do Three.js que exige WebGL 2.
- Nomes acessíveis do wordmark e do controle de movimento.
- Fallback que poderia ficar encoberto pelo Canvas após perda de contexto.
