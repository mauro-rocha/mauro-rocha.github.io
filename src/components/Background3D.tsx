import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Plane } from '@react-three/drei';
import * as THREE from 'three';

type Pointer = { x: number; y: number; scroll: number };
type PointerRef = React.MutableRefObject<Pointer>;

// R3F three.js intrinsics (TS augmentation only — runtime is provided by R3F)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      primitive: any;
      mesh: any;
      color: any;
    }
  }
}
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      primitive: any;
      mesh: any;
      color: any;
    }
  }
}

// Refined, restrained palette — cool blues on near-black
const PALETTE = {
  glow: new THREE.Color('#1e40af'),
  line: new THREE.Color('#3b82f6'),
  node: new THREE.Color('#93c5fd'),
  signal: new THREE.Color('#e0f2fe'),
  dustA: new THREE.Color('#3b82f6'),
  dustB: new THREE.Color('#93c5fd'),
};

// Framerate-independent damping
const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

/* -------------------------------------------------------------------------- */
/*  Ambient stardust — subtle, deep, with pointer/scroll parallax             */
/* -------------------------------------------------------------------------- */

const ParticleField = ({ pointerRef }: { pointerRef: PointerRef }) => {
  const points = useMemo(() => {
    const count = 520;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 64;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 48;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 48;
      scales[i] = Math.random() * 0.8 + 0.2;
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 26 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
        uColorA: { value: PALETTE.dustA.clone() },
        uColorB: { value: PALETTE.dustB.clone() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uSize;
        uniform vec2 uPointer;
        uniform float uScroll;
        attribute float aScale;
        attribute float aSeed;
        varying float vTwinkle;
        void main() {
          vec3 pos = position;
          float phase = aSeed * 6.2831853;
          pos.x += cos(uTime * 0.08 + phase) * 0.7;
          pos.y += sin(uTime * 0.11 + phase) * 0.7;
          float depth = clamp((pos.z + 24.0) / 48.0, 0.0, 1.0);
          pos.x += uPointer.x * depth * 3.0;
          pos.y += uPointer.y * depth * 3.0;
          pos.y += uScroll * depth * 6.0;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.4 + 0.6 * sin(uTime * 1.4 + aSeed * 40.0);
          vTwinkle = tw;
          gl_PointSize = uSize * aScale * (0.5 + tw * 0.6) * (1.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying float vTwinkle;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float alpha = pow(smoothstep(0.5, 0.0, d), 1.7);
          vec3 color = mix(uColorA, uColorB, vTwinkle);
          gl_FragColor = vec4(color, alpha * (0.18 + vTwinkle * 0.32));
        }
      `,
    });

    const obj = new THREE.Points(geometry, material);
    obj.frustumCulled = false;
    return obj;
  }, []);

  useFrame((state, delta) => {
    const u = (points.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPointer.value.x = damp(u.uPointer.value.x, pointerRef.current.x, 1.6, delta);
    u.uPointer.value.y = damp(u.uPointer.value.y, pointerRef.current.y, 1.6, delta);
    u.uScroll.value = damp(u.uScroll.value, pointerRef.current.scroll, 2.5, delta);
    points.rotation.y += delta * 0.008;
  });

  useEffect(() => {
    return () => {
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    };
  }, [points]);

  return <primitive object={points} />;
};

/* -------------------------------------------------------------------------- */
/*  Soft radial glow — a genuine, restrained bloom behind the network         */
/* -------------------------------------------------------------------------- */

const Glow = () => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: PALETTE.glow.clone() },
          uIntensity: { value: 0.4 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uIntensity;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            float d = distance(vUv, vec2(0.5));
            float a = smoothstep(0.5, 0.0, d);
            a = pow(a, 2.2);
            float breathe = 0.85 + 0.15 * sin(uTime * 0.6);
            gl_FragColor = vec4(uColor, a * uIntensity * breathe);
          }
        `,
      }),
    []
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <Plane args={[15, 15]} position={[3, 0, -3]} material={material} />;
};

/* -------------------------------------------------------------------------- */
/*  Neural network sphere — nodes + precise edges + travelling signals        */
/* -------------------------------------------------------------------------- */

const NeuralSphere = ({ pointerRef }: { pointerRef: PointerRef }) => {
  const { object, nodeMat, lineMat } = useMemo(() => {
    const COUNT = 110;
    const RADIUS = 2.4;
    const CONNECT = RADIUS * 0.5; // nearest-neighbour links only -> clean mesh

    // Even node distribution via Fibonacci sphere
    const pts: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      pts.push(
        new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(RADIUS)
      );
    }

    // --- Nodes (refined glowing points, occasional gentle flare) ---
    const nodePos = new Float32Array(COUNT * 3);
    const nodeSeed = new Float32Array(COUNT);
    pts.forEach((p, i) => {
      nodePos[i * 3] = p.x;
      nodePos[i * 3 + 1] = p.y;
      nodePos[i * 3 + 2] = p.z;
      nodeSeed[i] = Math.random();
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeed, 1));

    const nodeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 80 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uAspect: { value: 1 },
        uColor: { value: PALETTE.node.clone() },
        uFlare: { value: PALETTE.signal.clone() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uSize;
        uniform vec2 uPointer;
        uniform float uAspect;
        attribute float aSeed;
        varying float vGlow;
        varying float vAct;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec4 clip = projectionMatrix * mv;
          gl_Position = clip;

          // Gentle baseline shimmer
          float base = 0.5 + 0.25 * sin(uTime * 1.6 + aSeed * 28.0);

          // Neural "processing" wave sweeping through the sphere (always-on life)
          float wave = pow(0.5 + 0.5 * sin(uTime * 1.1 - position.y * 1.5 + aSeed * 3.0), 5.0);

          // Cursor activation in screen space — nodes light up near the pointer
          vec2 ndc = clip.xy / clip.w;
          vec2 dd = ndc - uPointer;
          dd.x *= uAspect;
          float act = smoothstep(0.5, 0.0, length(dd));
          vAct = act;

          vGlow = base + wave * 0.7 + act * 2.0;
          gl_PointSize = uSize * (0.5 + wave * 0.5 + act * 1.9) * (1.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uFlare;
        varying float vGlow;
        varying float vAct;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float a = pow(smoothstep(0.5, 0.0, d), 1.7);
          float core = smoothstep(0.16, 0.0, d) * (0.6 + vAct * 0.8);
          vec3 col = mix(uColor, uFlare, clamp(vGlow - 0.8, 0.0, 1.0));
          gl_FragColor = vec4(col, (a + core) * clamp(vGlow, 0.3, 1.9));
        }
      `,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    nodes.frustumCulled = false;

    // --- Edges (thin, faint lines with subtle travelling signals) ---
    const linePos: number[] = [];
    const lineParam: number[] = [];
    const lineSeed: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        if (pts[i].distanceTo(pts[j]) < CONNECT) {
          const a = pts[i];
          const b = pts[j];
          linePos.push(a.x, a.y, a.z, b.x, b.y, b.z);
          lineParam.push(0, 1);
          const s = Math.random();
          lineSeed.push(s, s);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lineGeo.setAttribute('aParam', new THREE.Float32BufferAttribute(lineParam, 1));
    lineGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(lineSeed, 1));

    const lineMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBase: { value: 0.1 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uAspect: { value: 1 },
        uColor: { value: PALETTE.line.clone() },
        uPulse: { value: PALETTE.signal.clone() },
      },
      vertexShader: /* glsl */ `
        uniform vec2 uPointer;
        uniform float uAspect;
        attribute float aParam;
        attribute float aSeed;
        varying float vParam;
        varying float vSeed;
        varying float vAct;
        void main() {
          vParam = aParam;
          vSeed = aSeed;
          vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = clip;
          vec2 ndc = clip.xy / clip.w;
          vec2 dd = ndc - uPointer;
          dd.x *= uAspect;
          vAct = smoothstep(0.5, 0.0, length(dd));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uBase;
        uniform vec3 uColor;
        uniform vec3 uPulse;
        varying float vParam;
        varying float vSeed;
        varying float vAct;
        void main() {
          // A smooth signal glides along ~half of the edges
          float active = step(0.5, vSeed);
          float phase = fract(uTime * 0.45 + vSeed);
          float pulse = smoothstep(0.12, 0.0, abs(vParam - phase)) * active;
          // Edges near the cursor brighten -> the web "wakes up" around the pointer
          float base = uBase + vAct * 0.55;
          vec3 col = uColor * base + uPulse * pulse * 1.7;
          gl_FragColor = vec4(col, base + pulse * 0.85);
        }
      `,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.frustumCulled = false;

    const object = new THREE.Group();
    object.add(lines);
    object.add(nodes);
    return { object, nodeMat, lineMat };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const { x, y } = pointerRef.current;

    for (const mat of [nodeMat, lineMat]) {
      const u = mat.uniforms;
      u.uTime.value = t;
      u.uAspect.value = aspect;
      u.uPointer.value.x = damp(u.uPointer.value.x, x, 6, delta);
      u.uPointer.value.y = damp(u.uPointer.value.y, y, 6, delta);
    }

    object.rotation.y += delta * 0.11;
    object.rotation.x = Math.sin(t * 0.12) * 0.1;
  });

  useEffect(
    () => () => {
      object.children.forEach((child) => {
        const o = child as THREE.Mesh;
        o.geometry?.dispose?.();
        (o.material as THREE.Material)?.dispose?.();
      });
    },
    [object]
  );

  return <primitive object={object} />;
};

const NeuralCore = ({ pointerRef }: { pointerRef: PointerRef }) => (
  <group>
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.5}>
      <NeuralSphere pointerRef={pointerRef} />
    </Float>
    {/* A few quiet glints for depth */}
    <Sparkles count={22} scale={[6, 6, 6]} size={2.4} speed={0.3} color={'#bfdbfe'} opacity={0.5} noise={1} />
  </group>
);

/* -------------------------------------------------------------------------- */
/*  Interaction wrapper — entrance reveal, pointer follow, scroll dolly        */
/* -------------------------------------------------------------------------- */

const InteractiveCore = ({ pointerRef }: { pointerRef: PointerRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const intro = useRef<number | null>(null);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const { x, y, scroll } = pointerRef.current;

    if (intro.current === null) intro.current = state.clock.elapsedTime;
    const p = Math.min((state.clock.elapsedTime - intro.current) / 1.8, 1);
    const introEase = 1 - Math.pow(1 - p, 4);

    // The whole sphere visibly leans toward the cursor
    g.rotation.x = damp(g.rotation.x, -y * 0.7, 3, delta);
    g.rotation.y = damp(g.rotation.y, x * 0.7 + scroll * 0.35, 3, delta);

    g.position.x = damp(g.position.x, 3 + x * 0.6, 2.5, delta);
    g.position.y = damp(g.position.y, y * 0.5 - scroll * 1.0, 2.5, delta);

    // Scales up as the cursor approaches it (right side) — signals interactivity
    const hover = 1 + THREE.MathUtils.smoothstep(x, -0.2, 0.8) * 0.12;
    const s = damp(g.scale.x, introEase * hover, 3.5, delta);
    g.scale.setScalar(s);
  });

  return (
    <group ref={groupRef} position={[3, 0, 0]} scale={0}>
      <NeuralCore pointerRef={pointerRef} />
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  Camera rig — gentle pointer parallax + scroll dolly                        */
/* -------------------------------------------------------------------------- */

const Rig = ({ pointerRef }: { pointerRef: PointerRef }) => {
  useFrame((state, delta) => {
    const { x, y, scroll } = pointerRef.current;
    state.camera.position.x = damp(state.camera.position.x, x * 0.4, 1.4, delta);
    state.camera.position.y = damp(state.camera.position.y, y * 0.4 + scroll * 0.6, 1.4, delta);
    state.camera.position.z = damp(state.camera.position.z, 9 + scroll * 1.2, 1.4, delta);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

export const Background3D: React.FC = () => {
  const pointerRef = useRef<Pointer>({ x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    const updatePointer = (clientX: number, clientY: number) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      pointerRef.current.x = (clientX / width) * 2 - 1;
      pointerRef.current.y = -(clientY / height) * 2 + 1;
    };

    const handlePointerMove = (e: PointerEvent) => updatePointer(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    };
    const handleScroll = () => {
      const max = window.innerHeight || 1;
      pointerRef.current.scroll = Math.min(window.scrollY / max, 2) * 0.5;
    };
    const resetPointer = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('blur', resetPointer);
    handleScroll();

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('blur', resetPointer);
    };
  }, []);

  return (
    <div id="webgl-container">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 50 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        dpr={[1, 2]}
      >
        <Rig pointerRef={pointerRef} />
        <ParticleField pointerRef={pointerRef} />
        <Glow />
        <InteractiveCore pointerRef={pointerRef} />
      </Canvas>
    </div>
  );
};
