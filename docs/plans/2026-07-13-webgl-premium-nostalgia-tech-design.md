# WebGL Premium Nostalgia Tech — design aprovado

Data: 2026-07-13  
Status: aprovado por Michel em 2026-07-13

## Visão

Experiência editorial WebGL de página única em que uma única matéria de fósforo reaprende a existir. A matéria começa como tensão residual, abre um feixe catódico, forma um raster curvo, organiza-se como memória de BIOS, dobra-se em topologia de terminal e barramentos e culmina como um volume CRT vivo.

O tema é nostalgia de tecnologia antiga, sem espaço, sem arcade neon e sem copiar formas, textos, paleta ou shaders de **A Forma da Atenção**.

## Princípios inegociáveis

- Um Canvas persistente e uma população estável de partículas.
- Um progresso global normalizado de `0..1`, derivado do scroll nativo.
- Transformações contínuas entre estados adjacentes; nenhuma troca de cena.
- Conteúdo editorial importante no DOM semântico.
- Movimento ambiente, interação direta e qualidade visual como políticas independentes.
- Pausa explícita congela o quadro inteiro sem reduzir DPR ou composição.
- `prefers-reduced-motion` remove movimento autônomo e preserva resposta direta moderada.
- Fallback completo quando WebGL não estiver disponível.
- Visuais, shaders, textos e ruídos originais, sem assets remotos obrigatórios.

## Direção visual

Paleta: grafite esverdeado, fósforo verde envelhecido, âmbar de diagnóstico e marfim editorial. Scanlines, bloom, vinheta, aberração cromática e ruído analógico serão usados como material sutil, nunca como filtro agressivo.

A composição contrapõe tipografia editorial ampla a microtipografia monoespaçada. A interface evita cards e HUDs genéricos; o conteúdo ocupa o espaço como uma publicação digital cinematográfica.

## Estados contínuos da matéria

1. **Sem sinal** — tensão residual e pontos quase invisíveis.
2. **Aquecimento** — linha catódica que abre o campo.
3. **Varredura** — raster curvo com profundidade e fósforo.
4. **Memória alta** — matriz inspirada em BIOS e endereços de memória.
5. **Prompt** — a matriz dobra-se em fluxos de terminal.
6. **Barramento** — os mesmos pontos formam trilhas e pulsos de circuito.
7. **Persistência** — a matéria converge em um volume CRT vivo com imagem fantasma.

## Primeiro impacto

Em até cinco segundos, a tela nasce escura, comprime-se em uma linha horizontal, abre como um CRT aquecendo e libera partículas de fósforo. O ponteiro curva o campo e deixa um vestígio. O primeiro scroll continua da mesma formação, sem corte.

## Arquitetura

- Vite + React + TypeScript.
- Three.js + React Three Fiber.
- Pós-processamento restrito a bloom, vinheta e aberração cromática moderada.
- Quality tiers iniciais: 18 mil, 32 mil e 56 mil partículas; DPR máximo 1.0, 1.35 e 1.75.
- Alvos determinísticos em `BufferGeometry`; geometria não é reconstruída durante o scroll.
- Shaders GLSL originais para morph, brilho de fósforo, pulso, gesto e profundidade.
- Relógio visual acumulado para pausa sem salto de fase.
- Overlay editorial responsivo, controle de pausa, navegação e status acessível.

## Seams de teste aprovados

1. Timeline pública: progresso de documento e interpolação adjacente.
2. Gerador público da matéria: determinismo, contagem e identidade entre estados.
3. Política pública de interação: normal, movimento reduzido e pausa.
4. Saída do aplicativo: DOM semântico, fallback, controles e Canvas único.

## Critérios de aceite da primeira versão

- Efeito inicial legível em até cinco segundos.
- Todos os sete estados conectados pela mesma matéria.
- Ponteiro produz resposta e memória visíveis.
- Pausa mantém quadros idênticos e retoma sem salto.
- Movimento reduzido, fallback, teclado e mobile funcionais.
- Sem overflow horizontal ou erros de console.
- Build, TypeScript, lint e testes aprovados.
- Capturas verificadas em múltiplos pontos do scroll e viewports.

