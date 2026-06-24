"use client";

import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LANDS } from "@/lib/constants";

const LAND_COLORS = LANDS.map(l => l.theme_color);

// ── Concentric arch rings (mimicking the real Sphere building) ──
function ArchRings({ entering }: { entering: boolean }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const rings = [
    { r: 3.8, t: 0.22, color: "#FF6B9D", speed: 0.0008 },
    { r: 3.5, t: 0.09, color: "#FFD166", speed: -0.0015 },
    { r: 3.15, t: 0.28, color: "#FF8C42", speed: 0.002 },
    { r: 2.85, t: 0.13, color: "#52D68A", speed: -0.0011 },
    { r: 2.5, t: 0.07, color: "#4CC9F0", speed: 0.003 },
  ];

  useFrame(() => {
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.z += rings[i].speed * (entering ? 12 : 1);
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        entering ? 1.2 : 0.15,
        0.06
      );
    });
  });

  return (
    <group>
      {rings.map((cfg, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }}>
          <torusGeometry args={[cfg.r, cfg.t, 12, 64]} />
          <meshPhysicalMaterial
            color={cfg.color}
            metalness={0.2}
            roughness={0.15}
            emissive={cfg.color}
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Portal disc in the center ──
function PortalDisc({ entering }: { entering: boolean }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.z = t * 0.4;
    const mat = mesh.current.material as THREE.MeshStandardMaterial;
    mat.opacity = entering
      ? THREE.MathUtils.lerp(mat.opacity, 0, 0.08)
      : 0.45 + Math.sin(t * 1.5) * 0.1;
    mat.emissiveIntensity = entering
      ? THREE.MathUtils.lerp(mat.emissiveIntensity, 4, 0.07)
      : 0.9 + Math.sin(t * 2) * 0.2;
  });

  return (
    <mesh ref={mesh} position={[0, 0, -0.2]}>
      <circleGeometry args={[2.35, 64]} />
      <meshStandardMaterial
        color="#FFD166"
        emissive="#FFD166"
        emissiveIntensity={0.8}
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Colored particle cloud ──
function ParticleField({ entering }: { entering: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const count = 200;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.8 + Math.random() * 7;
      positions[i * 3]     = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
      const c = new THREE.Color(LAND_COLORS[i % LAND_COLORS.length]);
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.getElapsedTime() * 0.025;
    if (entering) {
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, 6, 0.04);
      ref.current.rotation.z += 0.04;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[colors, 3]} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial size={0.11} vertexColors transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

// ── Camera rushes through the arch on Enter ──
function CameraFlyThrough({ entering }: { entering: boolean }) {
  useFrame((state) => {
    if (!entering) return;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, -14, 0.032);
    const cam = state.camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(cam.fov, 140, 0.038);
    cam.updateProjectionMatrix();
  });
  return null;
}

// ── Colorful ground wave planes ──
function WavePlanes() {
  const planeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const planes = [
    { color: "#FF6B9D", y: -4.5, z: -1 },
    { color: "#52D68A", y: -5.2, z: -0.5 },
    { color: "#FFD166", y: -5.8, z: 0 },
  ];

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    planeRefs.current.forEach((mesh, i) => {
      if (mesh) mesh.position.y = planes[i].y + Math.sin(t * 0.6 + i * 1.2) * 0.15;
    });
  });

  return (
    <>
      {planes.map((p, i) => (
        <mesh
          key={i}
          ref={el => { planeRefs.current[i] = el; }}
          position={[0, p.y, p.z]}
          rotation={[-Math.PI / 6, 0, 0]}
        >
          <planeGeometry args={[20, 3, 30, 1]} />
          <meshStandardMaterial color={p.color} transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

// ── Floating candy confetti ──
function ConfettiField() {
  const ref = useRef<THREE.Points>(null!);
  const count = 150;
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const palette   = ["#FF8C42", "#FFD166", "#FF6B9D", "#52D68A", "#4CC9F0", "#A78BFA", "#FF9A6C"];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;
      const c = new THREE.Color(palette[i % palette.length]);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] = positions[i * 3 + 1] + Math.sin(t * 0.5 + i * 0.4) * 0.6;
      pos[i * 3]     = positions[i * 3]     + Math.cos(t * 0.3 + i * 0.3) * 0.3;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[colors, 3]}    attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

// ── Full 3D gate scene ──
function GateScene({ entering }: { entering: boolean }) {
  return (
    <>
      <ambientLight intensity={3.0} />
      <pointLight position={[0, 0, 6]}   intensity={6}  color="#FF8C42" />
      <pointLight position={[6, 4, 3]}   intensity={4}  color="#FFD166" />
      <pointLight position={[-6, -3, 2]} intensity={3}  color="#52D68A" />
      <pointLight position={[0, 0, -10]} intensity={2.5} color="#4CC9F0" />
      <pointLight position={[4, -4, 4]}  intensity={2.5} color="#A78BFA" />
      <WavePlanes />
      <ArchRings entering={entering} />
      <PortalDisc entering={entering} />
      <ParticleField entering={entering} />
      <ConfettiField />
      <CameraFlyThrough entering={entering} />
    </>
  );
}

const DEFAULT_HERO = "/photos/sphere-arch-hero.jpeg";
const DEFAULT_TRANSITION = "/images/sphere-brand-pattern.jpeg";

// ── Main exported gate component ──
export default function SphereGate() {
  const [entering, setEntering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [heroPhoto, setHeroPhoto] = useState(DEFAULT_HERO);
  const [transitionPhoto, setTransitionPhoto] = useState(DEFAULT_TRANSITION);

  useEffect(() => {
    setMounted(true);
    fetch("/api/settings")
      .then(r => r.json())
      .then(json => {
        if (json.data?.home_hero_photo) setHeroPhoto(json.data.home_hero_photo);
        if (json.data?.home_transition_photo) setTransitionPhoto(json.data.home_transition_photo);
      })
      .catch(() => {});
  }, []);

  const handleEnter = useCallback(() => {
    if (entering) return;
    setEntering(true);
    // Portal expands for 900ms, then scroll — feels instant on mobile
    setTimeout(() => {
      const target = document.getElementById("lands-section");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
      }
      setTimeout(() => setEntering(false), 800);
    }, 900);
  }, [entering]);

  return (
    <section style={{ position: "relative", height: "100vh", minHeight: 520, overflow: "hidden", background: "#1a1a2e" }}>

      {/* Layer 0: Real arch photo background */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          src={heroPhoto}
          alt="The Sphere"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        />
        {/* Dark gradient overlay so 3D + text reads clearly */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(26,26,46,0.85) 0%, rgba(26,26,46,0.55) 45%, rgba(0,0,0,0.25) 100%)",
        }} />
      </div>

      {/* Layer 1: 3D Canvas — client only */}
      {mounted && (
        <Canvas
          style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
          camera={{ position: [0, 0, 8], fov: 60 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <GateScene entering={entering} />
          </Suspense>
        </Canvas>
      )}

      {/* Animations: transform-only — elements are ALWAYS visible (opacity never hidden) */}
      <style>{`
        @keyframes gateLogoIn {
          from { transform: scale(0.7) rotate(-12deg); }
          to   { transform: scale(1) rotate(0deg); }
        }
        @keyframes gateFadeUp {
          from { transform: translateY(20px); }
          to   { transform: translateY(0); }
        }
        @keyframes gateBtnIn {
          from { transform: scale(0.8); }
          to   { transform: scale(1); }
        }
        @keyframes gateScrollHint {
          0%, 100% { opacity: 0; }
          50%       { opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gate-logo, .gate-ws, .gate-tagline, .gate-btn { animation: none !important; }
        }
      `}</style>

      {/* Layer A: Sphere logo — absolutely centered in the arch circle */}
      <div style={{
        position: "absolute", zIndex: 20,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none", textAlign: "center",
      }}>
        <img
          className="gate-logo"
          src="/images/sphere-logo.png"
          alt="The Sphere by WellSpring"
          style={{
            width: "clamp(160px, 32vw, 300px)",
            height: "auto", objectFit: "contain",
            filter: "drop-shadow(0 0 48px rgba(245,196,0,0.7)) drop-shadow(0 4px 20px rgba(0,0,0,0.6))",
            animation: "gateLogoIn 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards",
          }}
        />
      </div>

      {/* Layer B: WellSpring brand + tagline — non-interactive text */}
      <div style={{
        position: "absolute", zIndex: 20,
        bottom: "calc(max(10%, 90px) + 72px)", left: 0, right: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none", textAlign: "center",
        padding: "0 1.5rem",
      }}>
        <img
          className="gate-ws"
          src="/images/ws-logo-white.png"
          alt="WellSpring"
          style={{
            height: 24, width: "auto", objectFit: "contain",
            marginBottom: "0.75rem",
            filter: "brightness(10) drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            opacity: 0.85,
            animation: "gateFadeUp 0.6s ease 0.5s forwards",
          }}
        />
        <p
          className="gate-tagline"
          style={{
            color: "rgba(255,255,255,0.92)",
            fontSize: "clamp(0.85rem, 3vw, 1rem)",
            margin: 0, maxWidth: 380,
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            lineHeight: 1.5,
            animation: "gateFadeUp 0.6s ease 0.7s forwards",
          }}
        >
          11 Worlds of Adventure — Where will you go first?
        </p>
      </div>

      {/* Layer C: Enter button — its OWN container so touch events always work on mobile */}
      <div style={{
        position: "absolute", zIndex: 25,
        bottom: "max(10%, 90px)", left: 0, right: 0,
        display: "flex", justifyContent: "center",
        padding: "0 1.5rem",
        pointerEvents: "none",
      }}>
        <motion.button
          className="gate-btn"
          whileTap={!entering ? { scale: 0.93 } : undefined}
          onClick={handleEnter}
          disabled={entering}
          style={{
            pointerEvents: "auto",
            touchAction: "manipulation",
            padding: "clamp(0.85rem, 2.5vw, 1.1rem) clamp(2rem, 6vw, 3.2rem)",
            minHeight: 56,
            background: entering
              ? "rgba(245,196,0,0.4)"
              : "linear-gradient(135deg, #F5C400 0%, #FF8C42 50%, #FF6B47 100%)",
            color: entering ? "rgba(255,255,255,0.8)" : "#1a1a2e",
            border: "3px solid rgba(255,255,255,0.9)",
            borderRadius: "9999px",
            fontSize: "clamp(1rem, 4vw, 1.25rem)",
            fontWeight: 900,
            cursor: entering ? "default" : "pointer",
            letterSpacing: "0.04em",
            boxShadow: "0 0 36px rgba(245,196,0,0.4), 0 4px 20px rgba(0,0,0,0.3)",
            transition: "background 0.3s",
            animation: "gateBtnIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.9s forwards",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {entering ? "🌀 Opening..." : "Enter The Sphere →"}
        </motion.button>
      </div>

      {/* Scroll hint */}
      <p style={{
        position: "absolute", bottom: "2rem", left: 0, right: 0,
        textAlign: "center",
        zIndex: 20,
        color: "rgba(255,255,255,0.9)", fontSize: "0.85rem",
        letterSpacing: "0.12em", pointerEvents: "none",
        textShadow: "0 2px 8px rgba(0,0,0,0.4)",
        animation: "gateScrollHint 3.2s ease 2.5s infinite",
        opacity: 0,
      }}>
        ↓ scroll to explore
      </p>

      {/* Photo portal reveal — real arch photo zooms in from center on enter */}
      <AnimatePresence>
        {entering && (
          <motion.div
            initial={{ clipPath: "circle(0% at 50% 50%)", opacity: 1 }}
            animate={{ clipPath: "circle(150% at 50% 50%)", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.88, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <img
              src={transitionPhoto}
              alt=""
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center",
              }}
            />
            {/* Warm tint so the reveal feels like stepping into sunlight */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, rgba(245,196,0,0.22) 0%, rgba(255,107,71,0.18) 60%, rgba(26,26,46,0.28) 100%)",
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
