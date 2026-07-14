import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
  createPhosphorFilamentTargetData,
  type PhosphorFilamentSegmentCount,
} from "./phosphor-filament-targets";
import { createPhosphorTargetData } from "./phosphor-targets";
import {
  filamentFragmentShader,
  filamentVertexShader,
  phosphorFragmentShader,
  phosphorVertexShader,
} from "./phosphor-shaders";
import type { VisualStateProps } from "./types";

type ShaderUniforms = Record<string, THREE.IUniform>;

function createUniforms(): ShaderUniforms {
  return {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uBoot: { value: 0 },
    uAspect: { value: 1 },
    uPixelRatio: { value: 1 },
    uPointerStrength: { value: 0 },
    uMemory: { value: 0 },
    uVelocity: { value: 0 },
    uReducedMotion: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uPointerMemory: { value: new THREE.Vector2() },
  };
}

function createPointGeometry(count: number): THREE.BufferGeometry {
  const targetData = createPhosphorTargetData(count, 0x435254);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(targetData.states[0], 3));

  for (let state = 1; state < targetData.stateCount; state += 1) {
    geometry.setAttribute(
      `aState${state}`,
      new THREE.BufferAttribute(targetData.states[state], 3),
    );
  }

  geometry.setAttribute("aMeta", new THREE.BufferAttribute(targetData.metadata, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 13);
  return geometry;
}

function createFilamentGeometry(
  segmentCount: PhosphorFilamentSegmentCount,
): THREE.BufferGeometry {
  const targetData = createPhosphorFilamentTargetData(segmentCount, 0x504f5354);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(targetData.states[0], 3));

  for (let state = 1; state < targetData.stateCount; state += 1) {
    geometry.setAttribute(
      `aState${state}`,
      new THREE.BufferAttribute(targetData.states[state], 3),
    );
  }

  geometry.setAttribute("aMeta", new THREE.BufferAttribute(targetData.metadata, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 13);
  return geometry;
}

interface UniformSnapshot {
  progress: number;
  time: number;
  boot: number;
  aspect: number;
  pixelRatio: number;
  pointerStrength: number;
  memory: number;
  velocity: number;
  reducedMotion: number;
  pointerX: number;
  pointerY: number;
  memoryX: number;
  memoryY: number;
}

function applyUniformSnapshot(
  material: THREE.ShaderMaterial,
  snapshot: UniformSnapshot,
): void {
  const uniforms = material.uniforms;
  uniforms.uProgress.value = snapshot.progress;
  uniforms.uTime.value = snapshot.time;
  uniforms.uBoot.value = snapshot.boot;
  uniforms.uAspect.value = snapshot.aspect;
  uniforms.uPixelRatio.value = snapshot.pixelRatio;
  uniforms.uPointerStrength.value = snapshot.pointerStrength;
  uniforms.uMemory.value = snapshot.memory;
  uniforms.uVelocity.value = snapshot.velocity;
  uniforms.uReducedMotion.value = snapshot.reducedMotion;
  (uniforms.uPointer.value as THREE.Vector2).set(
    snapshot.pointerX,
    snapshot.pointerY,
  );
  (uniforms.uPointerMemory.value as THREE.Vector2).set(
    snapshot.memoryX,
    snapshot.memoryY,
  );
}

function easeOutBoot(time: number): number {
  const progress = Math.min(1, Math.max(0, time / 4.2));
  return 1 - Math.pow(1 - progress, 3);
}

export function PhosphorField({
  refs,
  interaction,
  quality,
  motionPaused,
  reducedMotion,
}: VisualStateProps) {
  const { size } = useThree();
  const pointMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const filamentMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const smoothedPointer = useRef(new THREE.Vector2());
  const memoryPointer = useRef(new THREE.Vector2());
  const previousPointer = useRef(new THREE.Vector2());
  const memoryEnergy = useRef(0);

  const pointGeometry = useMemo(
    () => createPointGeometry(quality.particleCount),
    [quality.particleCount],
  );
  const filamentGeometry = useMemo(
    () =>
      createFilamentGeometry(
        quality.filamentSegments as PhosphorFilamentSegmentCount,
      ),
    [quality.filamentSegments],
  );
  const pointUniforms = useMemo(() => createUniforms(), []);
  const filamentUniforms = useMemo(() => createUniforms(), []);

  useEffect(() => () => pointGeometry.dispose(), [pointGeometry]);
  useEffect(() => () => filamentGeometry.dispose(), [filamentGeometry]);

  useFrame((_, rawDelta) => {
    const pointMaterial = pointMaterialRef.current;
    const filamentMaterial = filamentMaterialRef.current;
    if (!pointMaterial || !filamentMaterial) return;

    const aspect = size.height > 0 ? size.width / size.height : 1;

    if (motionPaused) {
      pointMaterial.uniforms.uAspect.value = aspect;
      pointMaterial.uniforms.uPixelRatio.value = quality.dpr;
      filamentMaterial.uniforms.uAspect.value = aspect;
      filamentMaterial.uniforms.uPixelRatio.value = quality.dpr;
      return;
    }

    const delta = Math.min(rawDelta, 0.05);
    const targetPointer = refs.pointer.current;
    const pointerEase = reducedMotion ? 1 : 1 - Math.exp(-delta * 10.5);
    smoothedPointer.current.x +=
      (targetPointer.x - smoothedPointer.current.x) * pointerEase;
    smoothedPointer.current.y +=
      (targetPointer.y - smoothedPointer.current.y) * pointerEase;

    const movementX = targetPointer.x - previousPointer.current.x;
    const movementY = targetPointer.y - previousPointer.current.y;
    const inputEnergy = Math.min(1, Math.hypot(movementX, movementY) * 3.2);
    previousPointer.current.set(targetPointer.x, targetPointer.y);

    if (reducedMotion) {
      memoryEnergy.current = 0;
      memoryPointer.current.copy(smoothedPointer.current);
    } else {
      memoryEnergy.current = Math.max(
        inputEnergy,
        memoryEnergy.current * Math.exp(-delta * 1.45),
      );
      memoryPointer.current.lerp(
        smoothedPointer.current,
        1 - Math.exp(-delta * 2.25),
      );
    }

    const progress = refs.progress.current;
    const time = refs.visualTime.current;
    const boot = reducedMotion
      ? 1
      : Math.max(easeOutBoot(time), Math.min(1, progress * 24));
    const snapshot: UniformSnapshot = {
      progress,
      time,
      boot,
      aspect,
      pixelRatio: quality.dpr,
      pointerStrength: interaction.directInputStrength,
      memory: memoryEnergy.current * interaction.directInputStrength,
      velocity: refs.velocity.current,
      reducedMotion: reducedMotion ? 1 : 0,
      pointerX: smoothedPointer.current.x,
      pointerY: smoothedPointer.current.y,
      memoryX: memoryPointer.current.x,
      memoryY: memoryPointer.current.y,
    };

    applyUniformSnapshot(pointMaterial, snapshot);
    applyUniformSnapshot(filamentMaterial, snapshot);
  });

  return (
    <group>
      <lineSegments geometry={filamentGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={filamentMaterialRef}
          uniforms={filamentUniforms}
          vertexShader={filamentVertexShader}
          fragmentShader={filamentFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest
          toneMapped={false}
        />
      </lineSegments>

      <points geometry={pointGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={pointMaterialRef}
          uniforms={pointUniforms}
          vertexShader={phosphorVertexShader}
          fragmentShader={phosphorFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest
          toneMapped={false}
        />
      </points>
    </group>
  );
}
