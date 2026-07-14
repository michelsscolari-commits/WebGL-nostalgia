import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EditorialOverlay } from "./editorial/EditorialOverlay";
import { EDITORIAL_CHAPTERS } from "./editorial/chapters";
import { VisualSystem } from "./experience/VisualSystem";
import {
  getDocumentProgress,
  resolveAnchoredProgress,
  resolveInteractionPolicy,
  usePageVisibility,
  useQualityProfile,
  useReducedMotion,
  useWebGLSupport,
} from "./experience/quality";
import type { ExperienceRefs, PointerCoordinates } from "./experience/types";

const BOOT_DURATION_SECONDS = 4.2;

function readDocumentProgress(): number {
  const fallback = getDocumentProgress({
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  });

  const anchors = EDITORIAL_CHAPTERS.map((chapter) => {
    const element = document.getElementById(chapter.id);
    if (!element) return null;
    return element.offsetTop + element.offsetHeight / 2 - window.innerHeight / 2;
  });

  if (anchors.some((anchor) => anchor === null)) return fallback;
  return resolveAnchoredProgress(window.scrollY, anchors as number[]);
}

export default function App() {
  const [motionPaused, setMotionPaused] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [narrativeProgress, setNarrativeProgress] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisibility();
  const quality = useQualityProfile();
  const webglSupport = useWebGLSupport();
  const targetProgressRef = useRef(0);
  const visualProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const visualTimeRef = useRef(reducedMotion ? BOOT_DURATION_SECONDS : 0);
  const pointerRef = useRef<PointerCoordinates>({ x: 0, y: 0 });
  const bootCompleteRef = useRef(false);

  const interaction = useMemo(
    () =>
      resolveInteractionPolicy({
        motionPaused,
        prefersReducedMotion: reducedMotion,
        pageVisible,
      }),
    [motionPaused, pageVisible, reducedMotion],
  );

  const experienceRefs = useMemo<ExperienceRefs>(
    () => ({
      progress: visualProgressRef,
      velocity: velocityRef,
      visualTime: visualTimeRef,
      pointer: pointerRef,
    }),
    [],
  );

  useEffect(() => {
    const updateTargetProgress = () => {
      targetProgressRef.current = readDocumentProgress();
    };

    updateTargetProgress();
    window.addEventListener("scroll", updateTargetProgress, { passive: true });
    window.addEventListener("resize", updateTargetProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateTargetProgress);
      window.removeEventListener("resize", updateTargetProgress);
    };
  }, []);

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      pointerRef.current.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      pointerRef.current.y = -(
        (event.clientY / Math.max(window.innerHeight, 1)) * 2 -
        1
      );
    };
    const resetPointer = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.documentElement.addEventListener("mouseleave", resetPointer);

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      document.documentElement.removeEventListener("mouseleave", resetPointer);
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    let previousTimestamp = performance.now();
    let previousTarget = targetProgressRef.current;
    let lastPublishedProgress = -1;

    const tick = (timestamp: number) => {
      const elapsed = Math.min((timestamp - previousTimestamp) / 1_000, 0.25);
      const delta = Math.min(elapsed, 0.05);
      previousTimestamp = timestamp;
      const target = targetProgressRef.current;

      if (pageVisible) {
        const rawVelocity = delta > 0 ? (target - previousTarget) / delta : 0;
        velocityRef.current +=
          (rawVelocity - velocityRef.current) * (1 - Math.exp(-delta * 8));
        previousTarget = target;

        if (!motionPaused) {
          const progressEase = reducedMotion ? 1 : 1 - Math.exp(-delta * 6.4);
          visualProgressRef.current +=
            (target - visualProgressRef.current) * progressEase;

          if (interaction.visualClockAdvances) {
            visualTimeRef.current += elapsed;
          } else {
            visualTimeRef.current = Math.max(
              visualTimeRef.current,
              BOOT_DURATION_SECONDS,
            );
          }
        }

        if (Math.abs(target - lastPublishedProgress) > 0.001) {
          lastPublishedProgress = target;
          setNarrativeProgress(target);
        }

        const bootProgress = reducedMotion
          ? 1
          : Math.min(1, visualTimeRef.current / BOOT_DURATION_SECONDS);
        document.documentElement.style.setProperty(
          "--scroll-progress",
          target.toFixed(5),
        );
        document.documentElement.style.setProperty(
          "--visual-progress",
          visualProgressRef.current.toFixed(5),
        );
        document.documentElement.style.setProperty(
          "--visual-time",
          visualTimeRef.current.toFixed(5),
        );
        document.documentElement.style.setProperty(
          "--boot-progress",
          bootProgress.toFixed(5),
        );

        if (
          !bootCompleteRef.current &&
          (bootProgress >= 1 || target > 0.025)
        ) {
          bootCompleteRef.current = true;
          setBootComplete(true);
        }
      }

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [interaction.visualClockAdvances, motionPaused, pageVisible, reducedMotion]);

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--scroll-progress");
      document.documentElement.style.removeProperty("--visual-progress");
      document.documentElement.style.removeProperty("--visual-time");
      document.documentElement.style.removeProperty("--boot-progress");
    },
    [],
  );

  const activeIndex = Math.min(
    EDITORIAL_CHAPTERS.length - 1,
    Math.round(narrativeProgress * (EDITORIAL_CHAPTERS.length - 1)),
  );
  const webglAvailable = Boolean(webglSupport) && !contextLost;
  const handleContextLost = useCallback(() => setContextLost(true), []);
  const handleContextRestored = useCallback(() => setContextLost(false), []);

  return (
    <div
      className="experience-shell"
      data-motion-paused={motionPaused}
      data-reduced-motion={reducedMotion}
      data-webgl-available={webglAvailable}
      data-quality-tier={quality.tier}
      data-particle-count={quality.particleCount}
    >
      <VisualSystem
        refs={experienceRefs}
        interaction={interaction}
        quality={quality}
        motionPaused={motionPaused}
        reducedMotion={reducedMotion}
        supported={Boolean(webglSupport)}
        contextLost={contextLost}
        onContextLost={handleContextLost}
        onContextRestored={handleContextRestored}
      />

      <div className="screen-effects" aria-hidden="true">
        <div className="scanline-layer" />
        <div className="noise-layer" />
      </div>

      <div
        className="boot-overlay"
        data-state={bootComplete ? "complete" : "booting"}
        aria-hidden={bootComplete || undefined}
      >
        <div className="boot-overlay__content">
          <p className="boot-overlay__line">RETRO/OS REV 4.7 — COLD BOOT</p>
          <p className="boot-overlay__line">PHOSPHOR ARRAY .......... ONLINE</p>
          <p className="boot-overlay__line">MEMORY TRACE ............ RESTORED</p>
          <p className="boot-overlay__line">PRESS SCROLL TO CONTINUE_</p>
        </div>
      </div>

      <EditorialOverlay
        progress={narrativeProgress}
        activeIndex={activeIndex}
        motionPaused={motionPaused}
        reducedMotion={reducedMotion}
        webglAvailable={webglAvailable}
        onToggleMotion={() => setMotionPaused((paused) => !paused)}
      />
    </div>
  );
}
