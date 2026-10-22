"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// ============================================================================
// ORIGINAL QRONOS VORTEX MATH & OPTIMIZED PERFORMANCE PIPELINE
// ============================================================================
const DEFAULT_LINE_OPTIONS = { count: 120, color: "#ffffff", glow: 10 };
const DEFAULT_DOT_OPTIONS = { count: 950, size: 28, color: "#ffffff", glow: 13, flicker: 10 };
const DEFAULT_COMET_OPTIONS = { count: 10, speed: 6, color: "#eca8d6", glow: 6, tail: 19, delay: 8, collide: 6 };
const DEFAULT_REPEL_OPTIONS = { radius: 60, strength: 10 };

const TAU = 2 * Math.PI;
const FRAME_DURATION = 1 / 60;
const POINTS_PER_STRAND = 200;
const SEGMENTS_PER_STRAND = POINTS_PER_STRAND - 1;

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function zoomToFov(zoom: number): number {
  return clamp(134 - zoom, 1, 175);
}

function easeCubic(val: number, min: number, max: number): number {
  if (val <= min) return 0;
  if (val >= max) return 1;
  const r = (val - min) / (max - min);
  return 1 - (1 - r) * (1 - r) * (1 - r);
}

// Monotone Cubic Spline (Fritsch-Carlson) for smooth hyperbolic interpolation
function monotoneCubicSpline(points: [number, number][]): (x: number) => number {
  const n = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    slopes[i] = (points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]);
  }
  const tangents: number[] = [slopes[0]];
  for (let i = 1; i < n - 1; i++) {
    tangents[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }
  tangents[n - 1] = slopes[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slopes[i]) < 1e-12) {
      tangents[i] = tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const f = 3 / Math.sqrt(s);
      tangents[i] = f * a * slopes[i];
      tangents[i + 1] = f * b * slopes[i];
    }
  }
  return (x: number) => {
    if (x <= points[0][0]) return points[0][1];
    if (x >= points[n - 1][0]) return points[n - 1][1];
    let i = 0;
    while (i < n - 2 && points[i + 1][0] < x) i++;
    const h = points[i + 1][0] - points[i][0];
    const t = (x - points[i][0]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * points[i][1] +
      (t3 - 2 * t2 + t) * h * tangents[i] +
      (-2 * t3 + 3 * t2) * points[i + 1][1] +
      (t3 - t2) * h * tangents[i + 1]
    );
  };
}

function precomputeSpline(fn: (x: number) => number): Float32Array {
  const table = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    table[i] = fn(i / 1023);
  }
  return table;
}

function samplePrecomputed(table: Float32Array, t: number): number {
  if (t <= 0) return table[0];
  const maxIdx = table.length - 1;
  if (t >= 1) return table[maxIdx];
  const r = t * maxIdx;
  const n = r | 0;
  return table[n] + (table[n + 1] - table[n]) * (r - n);
}

interface VortexProps {
  background?: string;
  topRadius?: number;
  waistRadius?: number;
  waistPosition?: number;
  bottomRadius?: number;
  twist?: number;
  zoom?: number;
  speed?: number;
  direction?: "left" | "right";
  lineOptions?: Partial<typeof DEFAULT_LINE_OPTIONS>;
  dots?: boolean;
  dotOptions?: Partial<typeof DEFAULT_DOT_OPTIONS>;
  comets?: boolean;
  cometOptions?: Partial<typeof DEFAULT_COMET_OPTIONS>;
  repel?: boolean;
  repelOptions?: Partial<typeof DEFAULT_REPEL_OPTIONS>;
  style?: React.CSSProperties;
  className?: string;
}

export default function VortexBackground({
  background = "#000000",
  topRadius = 380,
  waistRadius = 53,
  waistPosition = 50,
  bottomRadius = 1150,
  twist = 3,
  zoom = 75,
  speed = 10,
  direction = "right",
  lineOptions = DEFAULT_LINE_OPTIONS,
  dots = true,
  dotOptions = DEFAULT_DOT_OPTIONS,
  comets = true,
  cometOptions = DEFAULT_COMET_OPTIONS,
  repel = true,
  repelOptions = DEFAULT_REPEL_OPTIONS,
  style,
  className,
}: VortexProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mergedLine = { ...DEFAULT_LINE_OPTIONS, ...lineOptions };
  const mergedDot = { ...DEFAULT_DOT_OPTIONS, ...dotOptions };
  const mergedComet = { ...DEFAULT_COMET_OPTIONS, ...cometOptions };
  const mergedRepel = { ...DEFAULT_REPEL_OPTIONS, ...repelOptions };

  const config = {
    floorRadius: bottomRadius / 60,
    waistRadius: waistRadius / 60,
    crownRadius: topRadius / 60,
    waistAt: 1 - waistPosition / 100,
    twist,
    zoom,
    flowDir: direction === "left" ? -1 : 1,
    flowSpeed: (speed / 100) * (direction === "left" ? -1 : 1),
    lineCount: mergedLine.count,
    lineColor: mergedLine.color,
    lineGlow: (mergedLine.glow / 10) * 1.0,
    showDots: dots,
    dotCount: mergedDot.count,
    dotSize: mergedDot.size / 1000,
    dotColor: mergedDot.color,
    dotGlow: (mergedDot.glow / 10) * 4.2,
    dotFlicker: mergedDot.flicker / 10,
    showComets: comets,
    cometCount: mergedComet.count,
    cometSpeed: (mergedComet.speed / 10) * 0.15,
    cometColor: mergedComet.color,
    cometGlow: (mergedComet.glow / 10) * 1.0,
    cometTail: mergedComet.tail,
    cometDelay: mergedComet.delay,
    collideForce: mergedComet.collide / 10,
    hoverRepel: repel,
    repelRadius: mergedRepel.radius,
    repelStrength: mergedRepel.strength,
    running: true,
  };

  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);

    let isDisposed = false;
    let isVisible = true;
    let animId = 0;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        depth: false,
        stencil: false,
      });
    } catch (e) {
      console.warn("[Vortex] WebGL failed:", e);
      return;
    }

    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.38;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(zoomToFov(configRef.current.zoom), 1, 0.1, 500);
    const group = new THREE.Group();
    scene.add(group);

    // Uniforms for interactive cursor repel shader
    const repelUniforms = {
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1.0 },
      uRadius: { value: 0.2 },
      uStrength: { value: 0.0 },
    };

    const injectRepelShader = (mat: THREE.Material) => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uMouse = repelUniforms.uMouse;
        shader.uniforms.uAspect = repelUniforms.uAspect;
        shader.uniforms.uRadius = repelUniforms.uRadius;
        shader.uniforms.uStrength = repelUniforms.uStrength;
        shader.vertexShader = shader.vertexShader
          .replace(
            "void main() {",
            "uniform vec2 uMouse;\nuniform float uAspect;\nuniform float uRadius;\nuniform float uStrength;\nvoid main() {"
          )
          .replace(
            "#include <fog_vertex>",
            "#include <fog_vertex>\nif (uStrength > 0.0 && uRadius > 0.0 && gl_Position.w > 0.0) {\n    vec2 ndc = gl_Position.xy / gl_Position.w;\n    vec2 off = ndc - uMouse;\n    float dist = length(off * vec2(uAspect, 1.0));\n    float f = uStrength * exp(-(dist * dist) / (2.0 * uRadius * uRadius));\n    float m = length(off);\n    if (m > 1e-4) {\n        ndc += (off / m) * f;\n        gl_Position.xy = ndc * gl_Position.w;\n    }\n}"
          );
      };
      return mat;
    };

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    interface Strand {
      lane: number;
      speed: number;
      pulse: number;
      wobblePhase: number;
      from: number;
      to: number;
      bright: number;
      offset: number;
    }

    interface Comet {
      bright: number;
      lane: number;
      speed: number;
      pulse: number;
      wobblePhase: number;
      base: number;
      boost: number;
      boostMul: number;
      racing: boolean;
      s: number;
      idle: number;
      idleFor: number;
      trail: Float32Array;
      trailCol: Float32Array;
      geo: THREE.BufferGeometry;
      line: THREE.Line;
      head: THREE.Sprite;
    }

    interface Shockwave {
      active: boolean;
      x: number;
      y: number;
      z: number;
      at: number;
      amp: number;
    }

    let strands: Strand[] = [];
    let linePositions = new Float32Array(0);
    let lineColors = new Float32Array(0);
    let lineGeometry: THREE.BufferGeometry | null = null;

    interface Dot {
      s: number;
      lane: number;
      strand: number;
      pulse: number;
      wobblePhase: number;
      flickerRate: number;
      bright: number;
      radialOffset: number;
      heightOffset: number;
    }

    let dotCount = 0;
    let dotsData: Dot[] = [];
    let dotInstancedMesh: THREE.InstancedMesh | null = null;
    let dotBasePos = new Float32Array(0);
    let dotDisplace = new Float32Array(0);
    let dotVelocities = new Float32Array(0);
    let dotScales = new Float32Array(0);
    let dotScaleVel = new Float32Array(0);
    let dotShockTimers = new Float32Array(0);
    let dotShockBoost = new Float32Array(0);
    let dotAlphaFactors = new Float32Array(0);
    let dotColors = new Float32Array(0);
    let hasActiveDotPhysics = false;

    let shockwaves: Shockwave[] = [];
    for (let i = 0; i < 16; i++) {
      shockwaves.push({ active: false, x: 0, y: 0, z: 0, at: 0, amp: 1 });
    }
    let hasActiveShockwaves = false;

    let cometsList: Comet[] = [];
    const dummyMatrix = new THREE.Matrix4();
    const colors = {
      strand: new THREE.Color(),
      dot: new THREE.Color(),
      comet: new THREE.Color(),
    };
    const cachedColorStrings = { line: "", dot: "", comet: "" };

    function updateColors(cfg: typeof config) {
      if (cfg.lineColor !== cachedColorStrings.line) {
        colors.strand.set(cfg.lineColor);
        cachedColorStrings.line = cfg.lineColor;
      }
      if (cfg.dotColor !== cachedColorStrings.dot) {
        colors.dot.set(cfg.dotColor);
        cachedColorStrings.dot = cfg.dotColor;
      }
      if (cfg.cometColor !== cachedColorStrings.comet) {
        colors.comet.set(cfg.cometColor);
        cachedColorStrings.comet = cfg.cometColor;
        for (const comet of cometsList) {
          (comet.head.material as THREE.SpriteMaterial).color.setRGB(
            1.2 * colors.comet.r,
            1.2 * colors.comet.g,
            1.2 * colors.comet.b
          );
        }
      }
    }

    let splineHelpers: {
      writePoint: (
        target: Float32Array,
        offset: number,
        prog: number,
        lane: number,
        flow: number,
        wobbleAmp: number,
        wobblePhase: number,
        time: number
      ) => void;
      writeDotPoint: (
        target: Float32Array,
        offset: number,
        prog: number,
        lane: number,
        flow: number,
        wobbleAmp: number,
        wobblePhase: number,
        time: number,
        radialOffset: number,
        heightOffset: number
      ) => void;
      lane: (idx: number, total: number) => number;
    };

    function rebuildScene() {
      const cfg = configRef.current;
      for (let i = group.children.length - 1; i >= 0; i--) {
        group.remove(group.children[i]);
      }
      for (const d of disposables) d.dispose();
      disposables.length = 0;

      const waistAtClamped = clamp(cfg.waistAt, 0.08, 0.92);
      const floorR = cfg.floorRadius;
      const crownR = cfg.crownRadius;
      const totalTwist = cfg.twist * TAU;

      const radiusSpline = precomputeSpline(
        monotoneCubicSpline([
          [0, floorR],
          [0.24 * waistAtClamped, 0.667 * floorR],
          [0.5 * waistAtClamped, 0.3 * floorR],
          [0.76 * waistAtClamped, 0.08 * floorR],
          [waistAtClamped, cfg.waistRadius],
          [waistAtClamped + 0.3 * (1 - waistAtClamped), 0.2 * crownR],
          [waistAtClamped + 0.6 * (1 - waistAtClamped), 0.44 * crownR],
          [1, crownR],
        ])
      );

      const heightSpline = precomputeSpline(
        monotoneCubicSpline([
          [0, 0],
          [0.1, 0.2],
          [0.2, 0.8],
          [0.35, 2.0],
          [0.5, 3.8],
          [0.75, 7.0],
          [1, 10.0],
        ])
      );

      const twistSpline = precomputeSpline(
        monotoneCubicSpline([
          [0, 0],
          [0.15, 0.15 * totalTwist],
          [0.25, 0.25 * totalTwist],
          [0.45, 0.55 * totalTwist],
          [0.6, 0.7 * totalTwist],
          [0.8, 0.88 * totalTwist],
          [1, totalTwist],
        ])
      );

      splineHelpers = {
        writePoint(target, offset, prog, lane, flow, wobbleAmp, wobblePhase, time) {
          const r = samplePrecomputed(radiusSpline, prog);
          const y = samplePrecomputed(heightSpline, prog);
          const angle = samplePrecomputed(twistSpline, prog) + lane + flow;
          const wobble = r + Math.sin(25 * prog + wobblePhase + 0.3 * time) * wobbleAmp * r;
          target[offset] = Math.cos(angle) * wobble;
          target[offset + 1] = y;
          target[offset + 2] = Math.sin(angle) * wobble;
        },
        writeDotPoint(target, offset, prog, lane, flow, wobbleAmp, wobblePhase, time, radialOffset, heightOffset) {
          const r = samplePrecomputed(radiusSpline, prog);
          const y = samplePrecomputed(heightSpline, prog) + heightOffset;
          const angle = samplePrecomputed(twistSpline, prog) + lane + flow;
          const wobble = (r + Math.sin(25 * prog + wobblePhase + 0.3 * time) * wobbleAmp * r) * (1 + radialOffset);
          target[offset] = Math.cos(angle) * wobble;
          target[offset + 1] = y;
          target[offset + 2] = Math.sin(angle) * wobble;
        },
        lane: (idx, total) => (idx / total) * TAU,
      };

      camera.fov = zoomToFov(cfg.zoom);
      camera.updateProjectionMatrix();
      updateColors(cfg);

      const currentPointsPerStrand = isMobile ? 100 : POINTS_PER_STRAND;
      const currentSegmentsPerStrand = currentPointsPerStrand - 1;
      const lineTotal = isMobile
        ? Math.min(26, Math.max(3, Math.round(cfg.lineCount * 0.33)))
        : Math.max(3, Math.round(cfg.lineCount));
      const totalVertices = lineTotal * currentPointsPerStrand;
      linePositions = new Float32Array(totalVertices * 3);
      lineColors = new Float32Array(totalVertices * 3);

      lineGeometry = track(new THREE.BufferGeometry());
      const posAttr = new THREE.BufferAttribute(linePositions, 3);
      const colAttr = new THREE.BufferAttribute(lineColors, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      colAttr.setUsage(THREE.DynamicDrawUsage);
      lineGeometry.setAttribute("position", posAttr);
      lineGeometry.setAttribute("color", colAttr);

      // Pre-compute static index buffer for all strands
      const totalIndices = lineTotal * currentSegmentsPerStrand * 2;
      const indices = totalVertices > 65535 ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices);
      let idx = 0;
      for (let i = 0; i < lineTotal; i++) {
        const base = i * currentPointsPerStrand;
        for (let p = 0; p < currentSegmentsPerStrand; p++) {
          indices[idx++] = base + p;
          indices[idx++] = base + p + 1;
        }
      }
      lineGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

      const lineMat = track(
        injectRepelShader(
          new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.82,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        )
      );

      const lineSegments = new THREE.LineSegments(lineGeometry, lineMat);
      lineSegments.frustumCulled = false;
      group.add(lineSegments);

      strands = [];
      for (let i = 0; i < lineTotal; i++) {
        strands.push({
          lane: splineHelpers.lane(i, lineTotal),
          speed: 0.95 + 0.1 * Math.random(),
          pulse: Math.random() * TAU,
          wobblePhase: Math.random() * TAU,
          from: 0,
          to: 1,
          bright: 0.68,
          offset: i * currentPointsPerStrand * 3,
        });
      }

      // Star / Dot Particles (Distributed organically throughout the lines and depth)
      dotCount = cfg.showDots
        ? isMobile
          ? Math.min(160, Math.round(cfg.dotCount * 0.22))
          : Math.max(0, Math.round(cfg.dotCount))
        : 0;
      dotsData = [];
      for (let i = 0; i < dotCount; i++) {
        // Natural distribution along the curves:
        // Well-balanced across upper funnel, waist, and flared base
        const s = Math.random() < 0.65 ? 0.16 + 0.68 * Math.random() : 0.02 + 0.96 * Math.random();
        const strandIdx = Math.floor(Math.random() * strands.length);
        const strand = strands[strandIdx] ?? strands[0];
        // Spread lane across the gaps between lines so stars don't sit in a 1D grid
        const laneJitter = (Math.random() - 0.5) * (TAU / strands.length) * 2.0;
        // Radial and vertical dispersion
        const radialOffset = (Math.random() - 0.5) * 0.05;
        const heightOffset = (Math.random() - 0.5) * 0.08;

        dotsData.push({
          s,
          lane: strand.lane + laneJitter,
          strand: strandIdx,
          pulse: Math.random() * TAU,
          wobblePhase: Math.random() * TAU,
          flickerRate: 0.2 + 4.0 * Math.random(),
          bright: 0.28 + 0.72 * (Math.random() ** 1.1),
          radialOffset,
          heightOffset,
        });
      }

      dotBasePos = new Float32Array(3 * dotCount);
      dotDisplace = new Float32Array(3 * dotCount);
      dotVelocities = new Float32Array(3 * dotCount);
      dotScales = new Float32Array(dotCount).fill(1);
      dotScaleVel = new Float32Array(dotCount);
      dotShockTimers = new Float32Array(dotCount);
      dotShockBoost = new Float32Array(dotCount);
      dotAlphaFactors = new Float32Array(dotCount).fill(1);
      dotColors = new Float32Array(3 * dotCount);
      hasActiveDotPhysics = false;

      if (dotCount > 0) {
        const dotGeo = track(new THREE.PlaneGeometry(1, 1));
        const dotMat = track(
          injectRepelShader(
            new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.9,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          )
        );
        dotInstancedMesh = new THREE.InstancedMesh(dotGeo, dotMat, dotCount);
        dotInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        const colAttr = new THREE.InstancedBufferAttribute(dotColors, 3);
        colAttr.setUsage(THREE.DynamicDrawUsage);
        dotInstancedMesh.instanceColor = colAttr;
        dotInstancedMesh.frustumCulled = false;
        group.add(dotInstancedMesh);
      } else {
        dotInstancedMesh = null;
      }

      // Comet sprite texture
      const cometTexture = track(
        (() => {
          const cvs = document.createElement("canvas");
          cvs.width = cvs.height = 32;
          const ctx = cvs.getContext("2d");
          if (ctx) {
            const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            grad.addColorStop(0, "rgba(255,255,255,0.9)");
            grad.addColorStop(0.3, "rgba(255,120,255,0.4)");
            grad.addColorStop(0.7, "rgba(200,50,200,0.08)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 32, 32);
          }
          const tex = new THREE.CanvasTexture(cvs);
          tex.needsUpdate = true;
          return tex;
        })()
      );

      const cometTotal = cfg.showComets
        ? isMobile
          ? Math.min(3, Math.round(cfg.cometCount * 0.3))
          : Math.max(0, Math.round(cfg.cometCount))
        : 0;
      const cometTailPts = Math.max(2, Math.round(cfg.cometTail));
      cometsList = [];

      for (let i = 0; i < cometTotal; i++) {
        const trailPos = new Float32Array(3 * cometTailPts);
        const trailCol = new Float32Array(3 * cometTailPts);
        const cometGeo = track(new THREE.BufferGeometry());
        const tPos = new THREE.BufferAttribute(trailPos, 3);
        const tCol = new THREE.BufferAttribute(trailCol, 3);
        tPos.setUsage(THREE.DynamicDrawUsage);
        tCol.setUsage(THREE.DynamicDrawUsage);
        cometGeo.setAttribute("position", tPos);
        cometGeo.setAttribute("color", tCol);

        const cometMat = track(
          injectRepelShader(
            new THREE.LineBasicMaterial({
              vertexColors: true,
              transparent: true,
              opacity: 0.9,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          )
        );
        const cometLine = new THREE.Line(cometGeo, cometMat);
        cometLine.frustumCulled = false;

        const headMat = track(
          new THREE.SpriteMaterial({
            map: cometTexture,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: new THREE.Color(
              1.2 * colors.comet.r,
              1.2 * colors.comet.g,
              1.2 * colors.comet.b
            ),
          })
        );
        const headSprite = new THREE.Sprite(headMat);
        headSprite.scale.set(0.35, 0.35, 1);
        group.add(cometLine);
        group.add(headSprite);

        const strand = strands[Math.floor(Math.random() * strands.length)];
        const spd = cfg.cometSpeed * (0.7 + 0.6 * Math.random());
        cometsList.push({
          bright: 0.7 + 0.3 * Math.random(),
          lane: strand.lane,
          speed: spd,
          pulse: strand.speed,
          wobblePhase: strand.wobblePhase,
          base: spd,
          boost: 0,
          boostMul: 1,
          racing: false,
          s: 0,
          idle: 0,
          idleFor: 0.4 + (i / cometTotal) * cfg.cometDelay,
          trail: trailPos,
          trailCol: trailCol,
          geo: cometGeo,
          line: cometLine,
          head: headSprite,
        });
      }

      // Camera exact positioning from Qronos bundle:
      const camDist = 5 / Math.tan((67 * Math.PI) / 180 / 2);
      const camDir = new THREE.Vector3(3.4, -0.6, 10).normalize();
      const camTarget = new THREE.Vector3(0, 5, 0);
      camera.position.copy(camTarget).addScaledVector(camDir, camDist);
      camera.lookAt(camTarget);

      onResize();
    }

    let viewHeight = 1;
    function onResize() {
      const c = containerRef.current;
      if (!c) return;
      const w = c.clientWidth || 1;
      const h = c.clientHeight || 1;
      viewHeight = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      repelUniforms.uAspect.value = w / h;
      repelUniforms.uRadius.value = clamp(configRef.current.repelRadius / (h / 2), 0.01, 3);
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    let mouseTargetStrength = 0;
    const onPointerMove = (e: PointerEvent) => {
      const c = containerRef.current;
      if (!c) return;
      const cfg = configRef.current;
      const rect = c.getBoundingClientRect();
      if (rect.width && rect.height) {
        repelUniforms.uMouse.value.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -(((e.clientY - rect.top) / rect.height) * 2 - 1)
        );
        mouseTargetStrength =
          cfg.hoverRepel && cfg.running ? 0.45 * clamp(cfg.repelStrength / 100, 0, 1) : 0;
      }
    };
    const onPointerLeave = () => {
      mouseTargetStrength = 0;
    };

    if (!isMobile) {
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerleave", onPointerLeave);
      container.addEventListener("pointercancel", onPointerLeave);
    }

    rebuildScene();

    let flowAccum = 0;
    let frameAccum = 0;
    let dotFrameAccum = 0;
    let collisionCounter = 0;
    let lastTime = performance.now();
    let startTime = 0;



    const animate = (now: number) => {
      if (isDisposed || !isVisible) return;
      animId = requestAnimationFrame(animate);

      const cfg = configRef.current;
      const delta = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      if (!cfg.running) return;
      if (startTime === 0) startTime = now;

      const elapsed = (now - startTime) / 1000;
      const introLines = easeCubic(elapsed, 0, 2);
      const introDots = easeCubic(elapsed, 1.2, 3);
      const introComets = easeCubic(elapsed, 3, 5);

      updateColors(cfg);

      const targetFov = zoomToFov(cfg.zoom);
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }

      repelUniforms.uRadius.value = clamp(cfg.repelRadius / (viewHeight / 2), 0.01, 3);
      flowAccum += delta * cfg.flowSpeed;

      const strUniform = repelUniforms.uStrength;
      strUniform.value += (mouseTargetStrength - strUniform.value) * Math.min(1, 12 * delta);

      // Silky-smooth continuous line updates at native display refresh rate
      if (lineGeometry) {
        for (const strand of strands) {
          const strandFlow = flowAccum * strand.speed;
          const oGlow = strand.bright * cfg.lineGlow;
          const lMul = 0.15 + 1.5 * oGlow;
          const pulseTerm =
            Math.min(0.68 * oGlow * (0.9 + 0.1 * Math.sin(0.18 * elapsed + strand.pulse)), 0.88) *
            Math.min(3 * introLines, 1);
          const cProg = strand.from + introLines * (strand.to - strand.from);
          const uProg = 0.15 * (strand.to - strand.from);
          const baseOffset = strand.offset;

          const currentPointsPerStrand = isMobile ? 100 : POINTS_PER_STRAND;
          const currentSegmentsPerStrand = currentPointsPerStrand - 1;

          for (let pIdx = 0; pIdx < currentPointsPerStrand; pIdx++) {
            const nProg = pIdx / currentSegmentsPerStrand;
            const aProg = strand.from + nProg * (strand.to - strand.from);
            const o3 = baseOffset + 3 * pIdx;

            splineHelpers.writePoint(linePositions, o3, aProg, strand.lane, strandFlow, 0.008, strand.wobblePhase, elapsed);

            if (!isMobile && hasActiveShockwaves) {
              let sx = 0, sy = 0, sz = 0, anyActive = false;
              for (let n = 0; n < 16; n++) {
                const a = shockwaves[n];
                if (!a.active) continue;
                const c = elapsed - a.at;
                if (c > 2.5) { a.active = false; continue; }
                anyActive = true;
                const dx = linePositions[o3] - a.x;
                const dy = linePositions[o3 + 1] - a.y;
                const dz = linePositions[o3 + 2] - a.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < 0.001 || dist > 3.0) continue;
                const m = Math.abs(dist - 5.0 * c);
                if (m > 1.2) continue;
                const g = Math.cos((m / 1.2) * (Math.PI / 2));
                const v = Math.exp(-c / 0.8);
                const invDist = 1 / Math.max(dist, 0.3);
                const force = 0.5 * a.amp * 0.04 * g * v * invDist;
                sx += (dx / dist) * force;
                sy += (dy / dist) * force;
                sz += (dz / dist) * force;
              }
              if (!anyActive) hasActiveShockwaves = false;
              linePositions[o3] += sx;
              linePositions[o3 + 1] += sy;
              linePositions[o3 + 2] += sz;
            }

            let pFade = 1;
            if (nProg < 0.15) {
              const f = nProg / 0.15;
              pFade = f * f;
            } else if (nProg > 0.85) {
              const f = (1 - nProg) / 0.15;
              pFade = f * f;
            }

            let fGrowth = 1;
            if (aProg > cProg) fGrowth = 0;
            else if (aProg > cProg - uProg) {
              fGrowth = (cProg - aProg) / uProg;
              fGrowth *= fGrowth;
            }

            const intensity = pFade * lMul * fGrowth * pulseTerm;
            lineColors[o3] = colors.strand.r * intensity;
            lineColors[o3 + 1] = colors.strand.g * intensity;
            lineColors[o3 + 2] = colors.strand.b * intensity;
          }
        }
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;
      }

      // Dot shockwave physics
      if (hasActiveDotPhysics) {
        let anyMoving = false;
        for (let i = 0; i < dotCount; i++) {
          const r3 = 3 * i;
          for (let c = 0; c < 3; c++) {
            const spring = -50 * dotDisplace[r3 + c] - 9 * dotVelocities[r3 + c];
            dotVelocities[r3 + c] += spring * delta;
            dotDisplace[r3 + c] += dotVelocities[r3 + c] * delta;
          }
          const dispSq = dotDisplace[r3] ** 2 + dotDisplace[r3 + 1] ** 2 + dotDisplace[r3 + 2] ** 2;
          const velSq = dotVelocities[r3] ** 2 + dotVelocities[r3 + 1] ** 2 + dotVelocities[r3 + 2] ** 2;
          if (dispSq < 1e-8 && velSq < 1e-8) {
            dotDisplace[r3] = dotDisplace[r3 + 1] = dotDisplace[r3 + 2] = 0;
            dotVelocities[r3] = dotVelocities[r3 + 1] = dotVelocities[r3 + 2] = 0;
          } else anyMoving = true;

          const scaleSpring = -65 * (dotScales[i] - 1) - 11 * dotScaleVel[i];
          dotScaleVel[i] += scaleSpring * delta;
          dotScales[i] += dotScaleVel[i] * delta;
          if (Math.abs(dotScales[i] - 1) < 0.001 && Math.abs(dotScaleVel[i]) < 0.001) {
            dotScales[i] = 1;
            dotScaleVel[i] = 0;
          } else anyMoving = true;
        }
        if (!anyMoving) hasActiveDotPhysics = false;
      }

      // Silky-smooth continuous dot updates at native display refresh rate
      if (dotInstancedMesh && dotCount > 0 && dotsData.length === dotCount) {
        const dSize = cfg.dotSize;
        for (let i = 0; i < dotCount; i++) {
          const dot = dotsData[i];
          const strand = strands[dot.strand] ?? strands[0];
          const flow = flowAccum * strand.speed;
          const d3 = 3 * i;

          splineHelpers.writeDotPoint(
            dotBasePos,
            d3,
            dot.s,
            dot.lane,
            flow,
            0.008,
            dot.wobblePhase,
            elapsed,
            dot.radialOffset,
            dot.heightOffset
          );

          if (dotShockTimers[i] > 0) {
            dotShockTimers[i] += delta;
            const tm = dotShockTimers[i];
            if (tm < 0.6) {
              const pr = tm / 0.6;
              dotAlphaFactors[i] = (1 + 0.3 * (1 - pr)) * (1 - pr * pr);
              dotShockBoost[i] = 6 * (1 - pr * pr) ** 2;
            } else {
              dotAlphaFactors[i] = 0;
              dotShockBoost[i] = 0;
            }
            if (tm > 8) {
              dotShockTimers[i] = 0;
              dotAlphaFactors[i] = 1;
              dotShockBoost[i] = 0;
            }
          }

          const alpha = dotAlphaFactors[i];
          const scl = dSize * dotScales[i] * alpha;
          dummyMatrix.makeScale(scl, scl, scl);
          dummyMatrix.setPosition(
            dotBasePos[d3] + dotDisplace[d3],
            dotBasePos[d3 + 1] + dotDisplace[d3 + 1],
            dotBasePos[d3 + 2] + dotDisplace[d3 + 2]
          );
          dotInstancedMesh.setMatrixAt(i, dummyMatrix);

          const flicker =
            1 -
            cfg.dotFlicker +
            cfg.dotFlicker *
              (0.08 +
                0.92 *
                  Math.max(
                    0,
                    Math.sin(elapsed * dot.flickerRate + dot.pulse)
                  ) ** 2.5);

          const scaleGlow = dotScales[i] > 1.02 ? 1 + (dotScales[i] - 1) * 0.5 : 1;
          const intensity =
            dot.bright *
            flicker *
            cfg.dotGlow *
            scaleGlow *
            introDots *
            (1 + dotShockBoost[i]) *
            alpha;

          dotColors[d3] = colors.dot.r * intensity;
          dotColors[d3 + 1] = colors.dot.g * intensity;
          dotColors[d3 + 2] = colors.dot.b * intensity;
        }
        dotInstancedMesh.instanceMatrix.needsUpdate = true;
        if (dotInstancedMesh.instanceColor) dotInstancedMesh.instanceColor.needsUpdate = true;
        (dotInstancedMesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * introDots;
      }

      // Update comets
      for (const comet of cometsList) {
        const tailPts = comet.trail.length / 3;
        if (!comet.racing) {
          comet.head.material.opacity = 0;
          if (introComets < 0.3) continue;
          comet.idle += delta;
          if (comet.idle > comet.idleFor) {
            comet.racing = true;
            comet.s = cfg.flowDir < 0 ? 0.95 : 0.03;
            comet.base = cfg.cometSpeed * (0.7 + 0.6 * Math.random());
            comet.speed = comet.base;
            comet.boost = 0;
            comet.boostMul = 1;
            const picked = strands[Math.floor(Math.random() * strands.length)];
            comet.lane = picked.lane;
            comet.pulse = picked.speed;
            comet.wobblePhase = picked.wobblePhase;
          }
          continue;
        }

        if (comet.boost > 0) {
          comet.boost -= delta;
          if (comet.boost <= 0) {
            comet.boost = 0;
            comet.boostMul = 1;
          } else {
            comet.boostMul = 1 + 0.6 * (comet.boost / 0.4);
          }
          comet.speed = comet.base * comet.boostMul;
        }

        comet.s += delta * comet.speed * cfg.flowDir;
        if (cfg.flowDir < 0 ? comet.s < 0.03 : comet.s > 0.95) {
          comet.racing = false;
          comet.idle = 0;
          comet.idleFor = cfg.cometDelay * (0.6 + 0.8 * Math.random());
          comet.trailCol.fill(0);
          comet.geo.attributes.color.needsUpdate = true;
          comet.head.material.opacity = 0;
          continue;
        }

        const strandFlow = flowAccum * comet.pulse;
        const headFade =
          clamp((comet.s - 0.03) / 0.1, 0, 1) * clamp((0.95 - comet.s) / 0.1, 0, 1);

        for (let i = 0; i < tailPts; i++) {
          const sampProg = clamp(comet.s - 0.005 * i * cfg.flowDir, 0.005, 0.995);
          const i3 = 3 * i;
          splineHelpers.writePoint(comet.trail, i3, sampProg, comet.lane, strandFlow, 0.008, comet.wobblePhase, elapsed);

          const falloff = (1 - i / tailPts) ** 2;
          const intensity = comet.bright * cfg.cometGlow * falloff * headFade;
          const introFade = introComets * (i < 3 ? 1.3 : 1.0);
          comet.trailCol[i3] = colors.comet.r * intensity * introFade;
          comet.trailCol[i3 + 1] = colors.comet.g * intensity * introFade;
          comet.trailCol[i3 + 2] = colors.comet.b * intensity * introFade;
        }

        comet.head.position.set(comet.trail[0], comet.trail[1], comet.trail[2]);
        const boostScale = comet.boost > 0 ? 1 + (comet.boostMul - 1) * 0.8 : 1;
        comet.head.material.opacity = 0.35 * headFade * introComets * boostScale;
        comet.head.scale.set(0.35 * boostScale, 0.35 * boostScale, 1);
        comet.geo.attributes.position.needsUpdate = true;
        comet.geo.attributes.color.needsUpdate = true;
      }

      // Comet-dot collisions (every 4 frames) — skipped on mobile to save CPU
      if (!isMobile && ++collisionCounter % 4 === 0 && dotCount > 0 && cfg.collideForce > 0) {
        const collideDistSq = 0.64;
        for (const comet of cometsList) {
          if (!comet.racing) continue;
          const hx = comet.trail[0], hy = comet.trail[1], hz = comet.trail[2];
          if (hx === 0 && hy === 0 && hz === 0) continue;

          for (let d = 0; d < dotCount; d += 3) {
            const d3 = 3 * d;
            const dx = dotBasePos[d3] - hx;
            const dy = dotBasePos[d3 + 1] - hy;
            const dz = dotBasePos[d3 + 2] - hz;
            if (dx * dx + dy * dy + dz * dz < collideDistSq && dotShockTimers[d] === 0) {
              dotShockTimers[d] = 0.001;
              dotShockBoost[d] = 6 * cfg.collideForce;
              dotScales[d] = 1 + 0.3 * cfg.collideForce;

              hasActiveDotPhysics = true;
              hasActiveShockwaves = true;
              let slot = 0, oldest = Infinity;
              for (let s = 0; s < 16; s++) {
                if (!shockwaves[s].active) { slot = s; break; }
                if (shockwaves[s].at < oldest) { oldest = shockwaves[s].at; slot = s; }
              }
              shockwaves[slot] = { active: true, x: hx, y: hy, z: hz, at: elapsed, amp: 1 };

              for (let n = 0; n < dotCount; n++) {
                const n3 = 3 * n;
                const nx = dotBasePos[n3] - hx;
                const ny = dotBasePos[n3 + 1] - hy;
                const nz = dotBasePos[n3 + 2] - hz;
                const distSq = nx * nx + ny * ny + nz * nz;
                if (distSq > 4.0 || distSq < 1e-4) continue;
                const dist = Math.sqrt(distSq);
                const falloff = 1 - dist / 2;
                const force = (0.5 * falloff * falloff) / Math.max(dist, 0.1);
                dotVelocities[n3] += nx * force;
                dotVelocities[n3 + 1] += ny * force;
                dotVelocities[n3 + 2] += nz * force;
              }
              comet.boost = 0.4;
              comet.boostMul = 1.6;
              comet.speed = comet.base * comet.boostMul;
              break;
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (!wasVisible && isVisible && !isDisposed) {
          lastTime = performance.now();
          cancelAnimationFrame(animId);
          animId = requestAnimationFrame(animate);
        }
      },
      { threshold: 0 }
    );
    if (container) observer.observe(container);

    animate(performance.now());

    return () => {
      isDisposed = true;
      observer.disconnect();
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (container && !isMobile) {
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerleave", onPointerLeave);
        container.removeEventListener("pointercancel", onPointerLeave);
      }
      for (const d of disposables) d.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background,
        overflow: "hidden",
        ...style,
      }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
