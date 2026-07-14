import {
  Component,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";

import { PhosphorField } from "./PhosphorField";
import type { VisualStateProps } from "./types";

interface VisualSystemProps extends VisualStateProps {
  supported: boolean;
  contextLost: boolean;
  onContextLost: () => void;
  onContextRestored: () => void;
}

interface CanvasFailureBoundaryProps {
  children: ReactNode;
  onFailure: () => void;
}

class CanvasFailureBoundary extends Component<
  CanvasFailureBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onFailure();
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

function ContextLifecycle({
  onContextLost,
  onContextRestored,
  onReady,
}: Pick<VisualSystemProps, "onContextLost" | "onContextRestored"> & {
  onReady: () => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    const handleRestored = () => onContextRestored();

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);
    onReady();

    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl, onContextLost, onContextRestored, onReady]);

  return null;
}

function CameraRig({
  refs,
  interaction,
  motionPaused,
}: Pick<VisualStateProps, "refs" | "interaction" | "motionPaused">) {
  const { size } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDelta) => {
    if (motionPaused) return;

    const delta = Math.min(rawDelta, 0.05);
    const progress = refs.progress.current;
    const time = refs.visualTime.current;
    const pointer = refs.pointer.current;
    const portrait = size.height > size.width;
    const direct = interaction.directInputStrength;
    const ambient = interaction.ambientMotionEnabled ? 1 : 0;
    const smoothing = 1 - Math.exp(-delta * 3.4);
    const targetX = pointer.x * 0.18 * direct + Math.sin(time * 0.17) * 0.06 * ambient;
    const targetY = pointer.y * 0.11 * direct + Math.cos(time * 0.13) * 0.045 * ambient;
    const targetZ = (portrait ? 11.7 : 9.65) - progress * (portrait ? 0.18 : 0.48);

    state.camera.position.x +=
      (targetX - state.camera.position.x) * smoothing;
    state.camera.position.y +=
      (targetY - state.camera.position.y) * smoothing;
    state.camera.position.z +=
      (targetZ - state.camera.position.z) * smoothing;
    lookAt.set(0, progress > 0.8 && portrait ? 0.18 : 0, -0.3);
    state.camera.lookAt(lookAt);
  });

  return null;
}

function CinematicEffects({ enabled }: { enabled: boolean }) {
  const chromaticOffset = useMemo(() => new THREE.Vector2(0.00042, 0.00018), []);
  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.38}
        luminanceThreshold={0.58}
        luminanceSmoothing={0.28}
        mipmapBlur
      />
      <ChromaticAberration offset={chromaticOffset} radialModulation={false} />
      <Vignette offset={0.22} darkness={0.72} eskil={false} />
    </EffectComposer>
  );
}

export function VisualSystem({
  refs,
  interaction,
  quality,
  motionPaused,
  reducedMotion,
  supported,
  contextLost,
  onContextLost,
  onContextRestored,
}: VisualSystemProps) {
  const [canvasReady, setCanvasReady] = useState(false);
  const frameLoop = interaction.frameLoop;

  return (
    <div
      className="visual-layer"
      data-webgl-ready={canvasReady && !contextLost}
      aria-hidden="true"
    >
      <div className="fallback-field" />

      {supported ? (
        <CanvasFailureBoundary
          onFailure={() => {
            setCanvasReady(false);
            onContextLost();
          }}
        >
          <Canvas
            className="visual-canvas"
            dpr={quality.dpr}
            frameloop={frameLoop}
            camera={{ fov: 42, near: 0.1, far: 60, position: [0, 0, 9.65] }}
            gl={{
              antialias: false,
              alpha: true,
              depth: true,
              stencil: false,
              preserveDrawingBuffer: true,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 0.82;
              gl.setClearColor(0x050807, 1);
            }}
          >
            <ContextLifecycle
              onContextLost={() => {
                setCanvasReady(false);
                onContextLost();
              }}
              onContextRestored={() => {
                setCanvasReady(true);
                onContextRestored();
              }}
              onReady={() => setCanvasReady(true)}
            />
            <CameraRig
              refs={refs}
              interaction={interaction}
              motionPaused={motionPaused}
            />
            <PhosphorField
              refs={refs}
              interaction={interaction}
              quality={quality}
              motionPaused={motionPaused}
              reducedMotion={reducedMotion}
            />
            <CinematicEffects enabled={quality.postprocessingEnabled} />
          </Canvas>
        </CanvasFailureBoundary>
      ) : null}
    </div>
  );
}
