# AGENTS.md

## Contexto

Leia `README.md`, `PROJECT_MEMORY.md` e os dois documentos em `docs/plans/` antes de alterar a experiência.

## Guardrails

- Preserve um único Canvas e a identidade das partículas entre os sete estados.
- Não introduza tema espacial, cenas separadas, cards neon ou assets de terceiros sem decisão explícita.
- Mantenha DOM semântico como superfície principal e WebGL como aprimoramento visual.
- Não associe `prefers-reduced-motion` a perda automática de qualidade.
- Pausa deve congelar o relógio completo e o framebuffer.
- WebGL 1 não é suportado pelo renderer atual; use o fallback.
- Não instale pacotes sem aprovação do usuário.

## Verificação obrigatória

```powershell
npm run check
```

Para mudanças de movimento, shader, scroll ou fallback, execute também `scripts/visual-audit.mjs` conforme o README e registre a evidência em `docs/validation/`.

## Registro

Atualize `CHANGELOG.md` e `PROJECT_MEMORY.md` quando uma decisão, erro resolvido ou aprendizado mudar o modo correto de evoluir o projeto.
