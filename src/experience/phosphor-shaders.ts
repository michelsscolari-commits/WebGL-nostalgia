export const phosphorVertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uBoot;
  uniform float uAspect;
  uniform float uPixelRatio;
  uniform float uPointerStrength;
  uniform float uMemory;
  uniform float uVelocity;
  uniform float uReducedMotion;
  uniform vec2 uPointer;
  uniform vec2 uPointerMemory;

  attribute vec3 aState1;
  attribute vec3 aState2;
  attribute vec3 aState3;
  attribute vec3 aState4;
  attribute vec3 aState5;
  attribute vec3 aState6;
  attribute vec4 aMeta;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vEnergy;
  varying float vBoot;

  float smoother(float value) {
    float x = clamp(value, 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }

  vec3 statePosition(float phase) {
    if (phase < 1.0) return mix(position, aState1, smoother(phase));
    if (phase < 2.0) return mix(aState1, aState2, smoother(phase - 1.0));
    if (phase < 3.0) return mix(aState2, aState3, smoother(phase - 2.0));
    if (phase < 4.0) return mix(aState3, aState4, smoother(phase - 3.0));
    if (phase < 5.0) return mix(aState4, aState5, smoother(phase - 4.0));
    return mix(aState5, aState6, smoother(phase - 5.0));
  }

  void main() {
    float phase = clamp(uProgress, 0.0, 1.0) * 6.0;
    vec3 transformed = statePosition(phase);
    float motion = 1.0 - uReducedMotion;
    float boot = max(uBoot, smoothstep(0.0, 0.045, uProgress));

    float beamReach = smoother(smoothstep(0.02, 0.34, boot));
    float fieldOpen = smoother(smoothstep(0.27, 0.94, boot));
    vec3 ignition = vec3(transformed.x * beamReach, 0.0, transformed.z * 0.08);
    transformed = mix(ignition, transformed, fieldOpen);

    float phasePulse = sin(uTime * (0.72 + aMeta.z * 0.6) + aMeta.x * 31.0);
    float rasterPulse = sin(transformed.y * 16.0 - uTime * 2.25 + aMeta.y * 9.0);
    transformed.z += (phasePulse * 0.035 + rasterPulse * 0.012) * motion;
    transformed.y += phasePulse * 0.012 * motion * (0.5 + uProgress);

    vec2 pointerScale = vec2(mix(3.25, 5.1, clamp(uAspect - 0.5, 0.0, 1.0)), 2.85);
    vec2 pointerWorld = uPointer * pointerScale;
    vec2 pointerDelta = transformed.xy - pointerWorld;
    float pointerDistance = dot(pointerDelta, pointerDelta);
    float pointerField = exp(-pointerDistance * 0.72) * uPointerStrength;
    vec2 pointerDirection = normalize(pointerDelta + vec2(0.0001));

    vec2 memoryWorld = uPointerMemory * pointerScale;
    vec2 memoryDelta = transformed.xy - memoryWorld;
    float memoryField = exp(-dot(memoryDelta, memoryDelta) * 0.5) * uMemory;

    float terminalGate = smoothstep(0.43, 0.73, uProgress);
    vec2 tangent = vec2(-pointerDirection.y, pointerDirection.x);
    transformed.xy += pointerDirection * pointerField * (0.24 + uVelocity * 0.05);
    transformed.xy += tangent * pointerField * terminalGate * 0.13;
    transformed.z += pointerField * 0.38 + memoryField * 0.17;

    float scanBand = 0.5 + 0.5 * sin(transformed.y * 28.0 - uTime * 3.0);
    float biosGate = smoothstep(0.34, 0.52, uProgress) * (1.0 - smoothstep(0.78, 0.94, uProgress));
    float finalGate = smoothstep(0.78, 1.0, uProgress);
    vec3 phosphor = vec3(0.34, 0.92, 0.49);
    vec3 diagnosticAmber = vec3(1.0, 0.53, 0.20);
    vec3 warmIvory = vec3(1.0, 0.88, 0.66);
    vec3 color = mix(phosphor, diagnosticAmber, biosGate * (0.34 + aMeta.z * 0.44));
    color = mix(color, warmIvory, finalGate * (0.16 + scanBand * 0.32));

    float ignitionFlash = exp(-pow((boot - 0.28) * 7.0, 2.0));
    float energy = 0.42 + aMeta.w * 0.36 + scanBand * 0.14 + ignitionFlash * 0.9;
    energy += min(abs(uVelocity) * 0.02, 0.18);

    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(
      uPixelRatio * (0.9 + aMeta.w * 1.25 + energy * 0.3) * (20.0 / max(2.5, -viewPosition.z)),
      0.8,
      4.4
    );

    vColor = color;
    vAlpha = clamp((0.2 + aMeta.w * 0.38 + scanBand * 0.08) * fieldOpen + ignitionFlash * 0.35, 0.0, 1.0);
    vEnergy = energy;
    vBoot = boot;
  }
`;

export const phosphorFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vEnergy;
  varying float vBoot;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float radius = length(centered) * 2.0;
    if (radius > 1.0) discard;

    float core = smoothstep(0.64, 0.06, radius);
    float halo = smoothstep(1.0, 0.1, radius) * 0.33;
    float aperture = 0.9 + 0.1 * cos(centered.y * 24.0);
    float alpha = (core + halo) * vAlpha * aperture;
    vec3 emission = vColor * (0.42 + core * vEnergy * 0.72 + halo * 0.24);
    emission *= mix(0.28, 1.0, smoothstep(0.02, 0.45, vBoot));

    gl_FragColor = vec4(emission, alpha);
  }
`;

export const filamentVertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uBoot;
  uniform float uAspect;
  uniform float uPointerStrength;
  uniform float uMemory;
  uniform float uReducedMotion;
  uniform vec2 uPointer;
  uniform vec2 uPointerMemory;

  attribute vec3 aState1;
  attribute vec3 aState2;
  attribute vec3 aState3;
  attribute vec3 aState4;
  attribute vec3 aState5;
  attribute vec3 aState6;
  attribute vec4 aMeta;

  varying vec3 vColor;
  varying float vAlpha;

  float smoother(float value) {
    float x = clamp(value, 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }

  vec3 statePosition(float phase) {
    if (phase < 1.0) return mix(position, aState1, smoother(phase));
    if (phase < 2.0) return mix(aState1, aState2, smoother(phase - 1.0));
    if (phase < 3.0) return mix(aState2, aState3, smoother(phase - 2.0));
    if (phase < 4.0) return mix(aState3, aState4, smoother(phase - 3.0));
    if (phase < 5.0) return mix(aState4, aState5, smoother(phase - 4.0));
    return mix(aState5, aState6, smoother(phase - 5.0));
  }

  void main() {
    float phase = clamp(uProgress, 0.0, 1.0) * 6.0;
    vec3 transformed = statePosition(phase);
    float boot = max(uBoot, smoothstep(0.0, 0.045, uProgress));
    float beamReach = smoother(smoothstep(0.04, 0.38, boot));
    float fieldOpen = smoother(smoothstep(0.34, 1.0, boot));
    transformed = mix(vec3(transformed.x * beamReach, 0.0, transformed.z * 0.08), transformed, fieldOpen);

    float motion = 1.0 - uReducedMotion;
    float wave = sin(aMeta.y * 24.0 - uTime * (0.8 + aMeta.z));
    transformed.z += wave * 0.026 * motion;

    vec2 pointerScale = vec2(mix(3.25, 5.1, clamp(uAspect - 0.5, 0.0, 1.0)), 2.85);
    vec2 delta = transformed.xy - uPointer * pointerScale;
    float field = exp(-dot(delta, delta) * 0.72) * uPointerStrength;
    transformed.xy += normalize(delta + vec2(0.0001)) * field * 0.16;

    vec2 memoryDelta = transformed.xy - uPointerMemory * pointerScale;
    transformed.z += exp(-dot(memoryDelta, memoryDelta) * 0.5) * uMemory * 0.12;

    float biosGate = smoothstep(0.34, 0.52, uProgress) * (1.0 - smoothstep(0.78, 0.94, uProgress));
    float finalGate = smoothstep(0.8, 1.0, uProgress);
    vColor = mix(vec3(0.24, 0.76, 0.37), vec3(1.0, 0.48, 0.16), biosGate * 0.58);
    vColor = mix(vColor, vec3(1.0, 0.82, 0.55), finalGate * 0.34);
    vAlpha = fieldOpen * (0.035 + smoothstep(0.14, 0.46, uProgress) * (0.08 + aMeta.w * 0.075));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const filamentFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.004) discard;
    gl_FragColor = vec4(vColor * 1.18, vAlpha);
  }
`;
