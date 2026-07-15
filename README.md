# WebGL Premium Nostalgia Tech

Experiência editorial WebGL guiada por scroll em que uma única matéria de fósforo volta à vida e se transforma continuamente: tensão residual, feixe catódico, raster, BIOS, terminal, barramento e persistência CRT.

Não há cenas isoladas, assets externos nem tema espacial. O conteúdo semântico permanece no DOM; WebGL é a camada visual progressiva.

## Produção

- Site: [webgl-nostalgia.vercel.app](https://webgl-nostalgia.vercel.app)
- Código: [github.com/michelsscolari-commits/WebGL-nostalgia](https://github.com/michelsscolari-commits/WebGL-nostalgia)
- Vercel: preset Vite, Node.js 24.x, `npm ci`, `npm run build` e saída `dist`.

O deploy de produção foi feito pela CLI autenticada. O GitHub App do Vercel ainda precisa receber acesso ao novo repositório para habilitar deploy automático a cada push.

## Rodar localmente

Requisito: Node.js 22.13 ou superior.

```powershell
cd "C:\Users\miche\Downloads\BASE\Projetos\WebGL Premium Nostalgia Tech"
npm install
npm run dev
```

Abra `http://localhost:4173`.

Para testar em um celular na mesma rede:

```powershell
npm run dev:mobile
```

Abra `http://IP-DESTA-MAQUINA:4173` no aparelho. O firewall do Windows pode pedir autorização para a rede privada.

## Interação

- Scroll transforma a mesma população de partículas entre sete estados.
- Ponteiro ou mouse deforma o campo e deixa uma memória curta no fósforo.
- **Pausar movimento** congela o relógio e o framebuffer sem reduzir a qualidade.
- `prefers-reduced-motion` remove movimento autônomo, mas preserva resposta direta sutil.
- Sem WebGL 2, o site usa uma composição CRT estática e mantém toda a narrativa.

## Arquitetura

| Camada | Responsabilidade |
|---|---|
| `src/experience/` | Canvas persistente, shaders, partículas, filamentos e pós-processamento |
| `src/experience/quality/` | timeline ancorada, tiers de qualidade e políticas de interação |
| `src/editorial/` | sete capítulos semânticos, navegação e controles acessíveis |
| `src/styles/` | direção CRT, tipografia editorial, scanlines, ruído e responsividade |
| `scripts/visual-audit.mjs` | auditoria real no Chromium, screenshots, axe e fingerprints do framebuffer |

Os tiers usam 18 mil, 32 mil ou 56 mil partículas e 2 mil, 4 mil ou 8 mil segmentos, com uma única topologia estável por carregamento.

## Testar

Validação padrão:

```powershell
npm run check
```

O comando executa ESLint, 22 testes Vitest, compilação TypeScript e build Vite.

A auditoria visual é opcional e reutiliza Playwright, Chrome e axe-core já disponíveis na máquina; eles não foram adicionados como dependências do projeto:

```powershell
$env:PLAYWRIGHT_MODULE_URL='file:///CAMINHO/PARA/playwright/index.mjs'
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:AXE_PATH='C:\CAMINHO\PARA\axe.min.js'
node scripts\visual-audit.mjs
```

As evidências locais são gravadas em `output/playwright/` e ficam fora do Git. O relatório consolidado desta versão está em `docs/validation/2026-07-13-v0.1.md`.

## Documentação

- `docs/plans/2026-07-13-webgl-premium-nostalgia-tech-design.md`: direção aprovada e critérios de aceite.
- `docs/plans/2026-07-13-webgl-premium-nostalgia-tech-implementation.md`: plano técnico executado.
- `PROJECT_MEMORY.md`: decisões, guardrails e aprendizados reutilizáveis.
- `CHANGELOG.md`: histórico de versões.
