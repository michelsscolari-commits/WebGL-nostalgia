import { EDITORIAL_CHAPTERS } from "./chapters";

export interface EditorialOverlayProps {
  progress: number;
  activeIndex: number;
  motionPaused: boolean;
  reducedMotion: boolean;
  webglAvailable: boolean;
  onToggleMotion: () => void;
}

function getSystemStatus({
  motionPaused,
  reducedMotion,
  webglAvailable,
}: Pick<
  EditorialOverlayProps,
  "motionPaused" | "reducedMotion" | "webglAvailable"
>): string {
  if (!webglAvailable) return "Modo visual estático";
  if (motionPaused) return "Movimento pausado";
  if (reducedMotion) return "Movimento reduzido";
  return "Sistema ativo";
}

export function EditorialOverlay({
  progress,
  activeIndex,
  motionPaused,
  reducedMotion,
  webglAvailable,
  onToggleMotion,
}: EditorialOverlayProps) {
  const boundedIndex = Math.min(
    EDITORIAL_CHAPTERS.length - 1,
    Math.max(0, activeIndex),
  );
  const progressPercentage = Math.round(
    Math.min(1, Math.max(0, progress)) * 100,
  );
  const status = getSystemStatus({
    motionPaused,
    reducedMotion,
    webglAvailable,
  });

  return (
    <div
      className="editorial"
      data-chapter-count={EDITORIAL_CHAPTERS.length}
      data-motion-paused={motionPaused}
    >
      <a className="skip-link" href="#narrativa">
        Pular para a narrativa
      </a>

      <header className="system-header">
        <a
          className="wordmark"
          href="#sem-sinal"
          aria-label="NOSTALGIA TECH — voltar ao início"
        >
          <span className="wordmark__primary">NOSTALGIA</span>
          <span className="wordmark__secondary">TECH / 1983—1999</span>
        </a>

        <div className="system-header__telemetry" aria-hidden="true">
          <span>MEM {String(progressPercentage).padStart(3, "0")}%</span>
          <span className="telemetry-pulse" />
        </div>

        <button
          className="motion-control"
          type="button"
          aria-label={motionPaused ? "Retomar movimento" : "Pausar movimento"}
          aria-pressed={motionPaused}
          onClick={onToggleMotion}
        >
          <span className="motion-control__icon" aria-hidden="true">
            {motionPaused ? "▶" : "Ⅱ"}
          </span>
          <span>{motionPaused ? "Retomar movimento" : "Pausar movimento"}</span>
        </button>
      </header>

      <nav className="chapter-navigation" aria-label="Momentos da experiência">
        <ol>
          {EDITORIAL_CHAPTERS.map((chapter, index) => (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={index === boundedIndex ? "step" : undefined}
              >
                <span>{chapter.number}</span>
                <span className="chapter-navigation__label">{chapter.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main id="narrativa">
        <div className="opening-statement" aria-labelledby="experience-title">
          <p className="opening-statement__kicker">Uma arqueologia elétrica</p>
          <h1 id="experience-title">
            A memória ainda brilha
            <span>depois que a máquina esquece.</span>
          </h1>
          <p className="opening-statement__instruction">
            Role para devolver energia ao sistema
          </p>
        </div>

        {EDITORIAL_CHAPTERS.map((chapter, index) => (
          <section
            className={`chapter chapter--${chapter.alignment}`}
            id={chapter.id}
            key={chapter.id}
            aria-labelledby={`${chapter.id}-title`}
            data-active={index === boundedIndex}
          >
            <div className="chapter__content">
              <p className="chapter__eyebrow">
                <span>{chapter.number}</span> / {chapter.label}
              </p>
              <h2 id={`${chapter.id}-title`} data-editorial-heading={chapter.number}>
                {chapter.heading}
              </h2>
              <p className="chapter__body">{chapter.body}</p>
              <p className="chapter__diagnostic" aria-hidden="true">
                {chapter.diagnostic}
              </p>
            </div>
          </section>
        ))}

        <footer className="closing-statement">
          <p>NO CARRIER</p>
          <p>A máquina dorme. O vestígio continua.</p>
          <a href="#sem-sinal">Reiniciar sistema</a>
        </footer>
      </main>

      <div className="system-status" role="status" aria-live="polite">
        <span aria-hidden="true" />
        {status}
      </div>
    </div>
  );
}
