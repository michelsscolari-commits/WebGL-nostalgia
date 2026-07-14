import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EditorialOverlay } from "../src/editorial/EditorialOverlay";

describe("saída editorial semântica", () => {
  it("publica uma narrativa navegável com sete momentos e controle real", () => {
    const html = renderToStaticMarkup(
      <EditorialOverlay
        activeIndex={0}
        motionPaused={false}
        progress={0}
        reducedMotion={false}
        webglAvailable
        onToggleMotion={() => undefined}
      />,
    );

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html.match(/data-editorial-heading=/g)).toHaveLength(7);
    expect(html).toContain('data-chapter-count="7"');
    expect(html).toContain('href="#sem-sinal"');
    expect(html).toContain('href="#persistencia"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Pausar movimento"');
    expect(html).toContain('aria-label="NOSTALGIA TECH — voltar ao início"');
    expect(html).toContain("Pausar movimento");
    expect(html).toContain("A memória ainda brilha");
  });

  it("informa fallback e estado pausado sem esconder o conteúdo", () => {
    const html = renderToStaticMarkup(
      <EditorialOverlay
        activeIndex={3}
        motionPaused
        progress={0.5}
        reducedMotion={false}
        webglAvailable={false}
        onToggleMotion={() => undefined}
      />,
    );

    expect(html).toContain("Retomar movimento");
    expect(html).toContain('aria-label="Retomar movimento"');
    expect(html).toContain("Modo visual estático");
    expect(html.match(/data-editorial-heading=/g)).toHaveLength(7);
  });
});
