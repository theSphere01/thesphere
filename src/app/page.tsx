"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SphereGate from "@/components/sphere/sphere-gate";
import LandsOrbit from "@/components/sphere/lands-orbit";
import PublicHeader from "@/components/layout/public-header";
import Footer from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { DEFAULT_HOME_GALLERY_PHOTOS, parseHomeGalleryPhotos } from "@/lib/home-gallery";

const STEPS = [
  {
    num: "01",
    icon: "📝",
    title: "Register",
    desc: "Parent registers the child at the gate in under 60 seconds. Profile created instantly.",
    color: "#FF8C42",
    bg: "rgba(255,140,66,0.1)",
    border: "rgba(255,140,66,0.3)",
  },
  {
    num: "02",
    icon: "🏷️",
    title: "Get Your Wristband",
    desc: "Receive your smart NFC wristband — your identity, timer, and scorecard all in one.",
    color: "#FF6B9D",
    bg: "rgba(255,107,157,0.1)",
    border: "rgba(255,107,157,0.3)",
  },
  {
    num: "03",
    icon: "🗺️",
    title: "Explore The Lands",
    desc: "Visit any of 11 activity lands. Each hour earns points. Each new land earns bonus points.",
    color: "#2EC4B6",
    bg: "rgba(46,196,182,0.1)",
    border: "rgba(46,196,182,0.3)",
  },
  {
    num: "04",
    icon: "🏆",
    title: "Earn & Win",
    desc: "Climb the leaderboard, unlock badges, and win prizes at the daily ceremony.",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.3)",
  },
];

const LEADERBOARD_MOCK = [
  { rank: 1, name: "Omar Hassan",   pts: 4850, color: "var(--color-rank-gold)" },
  { rank: 2, name: "Layla Ahmed",   pts: 4200, color: "var(--color-rank-silver)" },
  { rank: 3, name: "Karim Mostafa", pts: 3750, color: "var(--color-rank-bronze)" },
];

export default function HomePage() {
  const landsRef  = useRef(null);
  const stepsRef  = useRef(null);
  const lbRef     = useRef(null);
  const [galleryPhotos, setGalleryPhotos] = useState(DEFAULT_HOME_GALLERY_PHOTOS);

  const landsInView = useInView(landsRef, { once: true, margin: "-80px" });
  const stepsInView = useInView(stepsRef, { once: true, margin: "-80px" });
  const lbInView    = useInView(lbRef,    { once: true, margin: "-80px" });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setGalleryPhotos(parseHomeGalleryPhotos(json.data?.home_gallery_photos));
      })
      .catch(() => {
        if (!cancelled) setGalleryPhotos(DEFAULT_HOME_GALLERY_PHOTOS);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PublicHeader />

      {/* ── Section 1: The 3D Gate ── */}
      <SphereGate />

      {/* ── Photo Strip: The Real Sphere ── */}
      {galleryPhotos.length > 0 && (
      <section style={{
        background: "#1a1a2e",
        padding: "3rem 0 2.5rem",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/images/sphere-pattern-blue.jpeg)",
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.06, pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 1.5rem", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.18em", color: "var(--color-sphere-yellow)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              See It For Yourself
            </div>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900, color: "white", margin: 0 }}>
              The Real Sphere — Sahel, Egypt
            </h2>
          </div>

          {/* Horizontal scrolling photo strip — no opacity fade, just scale entrance */}
          <div style={{
            display: "flex", gap: "0.75rem",
            overflowX: "auto", paddingBottom: "1rem",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
            {galleryPhotos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ scale: 0.95 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                whileHover={{ scale: 1.04, zIndex: 2 }}
                style={{
                  flexShrink: 0,
                  width: "clamp(220px, 28vw, 320px)",
                  height: "clamp(260px, 34vw, 380px)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "2px solid rgba(245,196,0,0.25)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                />
              </motion.div>
            ))}
          </div>

          {/* Sphere logo watermark at end */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1.25rem" }}>
            <img src="/images/sphere-logo-yellow.png" alt="The Sphere" style={{ height: 36, width: 36, objectFit: "contain" }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
              The Sphere by WellSpring · Sahel, Egypt · 2025
            </span>
            <img src="/images/ws-logo-brand.png" alt="WellSpring" style={{ height: 22, width: "auto", objectFit: "contain", filter: "brightness(10) opacity(0.4)" }} />
          </div>
        </div>
      </section>
      )}

      {/* ── Section 2: 11 Worlds ── */}
      <section
        id="lands-section"
        ref={landsRef}
        style={{
          padding: "5rem 1.5rem 4rem",
          background: "linear-gradient(180deg, #FFF9EE 0%, #FFF0D6 60%, #FFE8C0 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Brand pattern overlay (very faint) */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/images/sphere-pattern-yellow.jpeg)",
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.05, pointerEvents: "none", mixBlendMode: "multiply",
        }} />
        {/* Decorative gradient blobs */}
        <div style={{ position: "absolute", top: "10%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,196,0,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(82,214,138,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "5%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(76,201,240,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1300, margin: "0 auto", position: "relative" }}>
          {/* Header — transform-only animation, always visible */}
          <motion.div
            initial={{ y: 32 }}
            animate={landsInView ? { y: 0 } : {}}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "2.5rem" }}
          >
            <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, color: "var(--color-sphere-coral)", marginBottom: "0.5rem" }}>
              11 Worlds of Adventure
            </h2>
            <p style={{ color: "var(--color-sphere-coral-dark)", fontSize: "1.1rem", fontStyle: "italic", fontWeight: 600 }}>
              Each one a universe — choose where you go first
            </p>
          </motion.div>

          <LandsOrbit />

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link
              href="/lands"
              style={{
                color: "white",
                fontWeight: 800, fontSize: "1.05rem",
                textDecoration: "none",
                padding: "0.9rem 2.5rem",
                background: "linear-gradient(135deg, #FF6B47 0%, #FF1A75 100%)",
                borderRadius: "9999px", display: "inline-block",
                boxShadow: "0 4px 24px rgba(255,26,117,0.4)",
                transition: "all 0.2s",
              }}
            >
              Explore All Lands & Stations →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 3: How It Works ── */}
      <section
        ref={stepsRef}
        style={{
          padding: "5rem 1.5rem",
          background: "#FFFDF7",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Brand pattern overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/images/sphere-pattern-blue.jpeg)",
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.04, pointerEvents: "none",
        }} />
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: 0, left: "25%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,196,0,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, right: "25%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(82,214,138,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", left: "5%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(76,201,240,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {/* Header — transform-only, always visible */}
          <motion.div
            initial={{ y: 24 }}
            animate={stepsInView ? { y: 0 } : {}}
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 900, color: "var(--color-dark)", marginBottom: "0.5rem" }}>
              How The{" "}
              <span style={{ color: "var(--color-sphere-coral)" }}>Play League</span>{" "}
              Works
            </h2>
            <p style={{ color: "rgba(26,26,46,0.6)", fontSize: "1rem" }}>
              Every child who enters doesn't just play — they compete, rank, and win.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ y: 32 }}
                animate={stepsInView ? { y: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ y: -6, boxShadow: `0 20px 48px ${step.color}25` }}
                style={{
                  background: step.bg,
                  border: `1px solid ${step.border}`,
                  borderRadius: "20px",
                  padding: "2rem 1.5rem",
                  position: "relative",
                  overflow: "hidden",
                  backdropFilter: "blur(8px)",
                  transition: "box-shadow 0.3s",
                }}
              >
                <div style={{
                  position: "absolute", top: "-0.5rem", right: "-0.5rem",
                  fontSize: "5rem", fontWeight: 900,
                  color: step.color, opacity: 0.12, lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{step.icon}</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-dark)", marginBottom: "0.5rem" }}>
                  {step.title}
                </div>
                <div style={{ color: "rgba(26,26,46,0.65)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                  {step.desc}
                </div>
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Leaderboard Preview ── */}
      <section
        ref={lbRef}
        style={{
          padding: "5rem 1.5rem",
          background: "#FFF9EE",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top, rgba(255,107,71,0.1) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(76,201,240,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative" }}>
          {/* Header — transform-only, always visible */}
          <motion.div
            initial={{ y: 24 }}
            animate={lbInView ? { y: 0 } : {}}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏆</div>
            <h2 style={{
              fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 900, marginBottom: "0.25rem",
              background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              The Play League
            </h2>
            <p style={{ color: "rgba(26,26,46,0.6)", marginBottom: "2.5rem", fontWeight: 500 }}>
              Season 2025 — Live Rankings
            </p>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2.5rem" }}>
            {LEADERBOARD_MOCK.map((entry, i) => (
              <motion.div
                key={entry.rank}
                initial={{ x: -20 }}
                animate={lbInView ? { x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.12 }}
                whileHover={{ x: 4, boxShadow: entry.rank === 1 ? "0 0 30px rgba(255,215,0,0.15)" : "none" }}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  background: entry.rank === 1 ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.85)",
                  border: `2px solid ${entry.rank === 1 ? "rgba(255,215,0,0.6)" : "rgba(26,26,46,0.12)"}`,
                  borderRadius: "14px", padding: "1rem 1.25rem",
                  boxShadow: entry.rank === 1 ? "0 4px 24px rgba(255,215,0,0.25)" : "0 2px 12px rgba(26,26,46,0.06)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `${entry.color}22`,
                  border: `2px solid ${entry.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: "1rem", color: entry.color, flexShrink: 0,
                }}>
                  {entry.rank === 1 ? "👑" : entry.rank === 2 ? "🥈" : "🥉"}
                </div>
                <div style={{ fontWeight: 700, color: "var(--color-dark)", flex: 1, textAlign: "left" }}>{entry.name}</div>
                <div style={{ fontWeight: 800, color: entry.color, fontSize: "1.15rem" }}>
                  {entry.pts.toLocaleString()} pts
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            href="/leaderboard"
            style={{
              display: "inline-block", padding: "1rem 2.5rem",
              background: "linear-gradient(135deg, #FF6B47, #E55A38)",
              color: "white", borderRadius: "9999px",
              fontWeight: 700, fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 0 30px rgba(255,107,71,0.4)",
            }}
          >
            🏆 View Live Leaderboard
          </Link>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
      <PWAInstallPrompt />
    </>
  );
}
