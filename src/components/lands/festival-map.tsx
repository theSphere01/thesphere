"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LANDS } from "@/lib/constants";

type Land = typeof LANDS[number];
type FilterKey = "all" | "open" | "young" | "older";

// ── Play League mock data ───────────────────────────────────────────────────
interface PlayLeagueChallenge {
  id: string;
  land_slug: string;
  title: string;
  description: string;
  bonus_points: number;
  current_participants: number;
}

const MOCK_CHALLENGES: PlayLeagueChallenge[] = [
  { id: "plc-1", land_slug: "science-land",   title: "Slime Lab Speed Run",        description: "Make the best slime in 15 minutes!", bonus_points: 150, current_participants: 24 },
  { id: "plc-2", land_slug: "sports-land",     title: "Dodgeball Championship",     description: "Compete in the ultimate dodgeball showdown!", bonus_points: 200, current_participants: 31 },
  { id: "plc-3", land_slug: "cooking-land",    title: "Cupcake Decoration Battle",  description: "Decorate the most amazing cupcake in 10 min!", bonus_points: 120, current_participants: 18 },
];

// ── Land layout config ──────────────────────────────────────────────────────
// 3-row organized layout — positions = blob centers as % of container
//
// Row 1 (y≈17%): Art · Fashion · Lego · VR          ← creative/expression
// Row 2 (y≈50%): Gardening · Cooking · Science · Sports ← activity/challenge
// Row 3 (y≈81%): Nilco · Beauty · Handmade           ← fun/craft
//
const LAND_POSITIONS: Record<string, { x: string; y: string }> = {
  // Row 1 — top (4 lands, evenly spaced across 14%–80%)
  "art-land":       { x: "14%", y: "17%" },
  "fashion-land":   { x: "34%", y: "17%" },
  "lego-building":  { x: "56%", y: "17%" },
  "vr-land":        { x: "78%", y: "17%" },
  // Row 2 — middle (4 lands, anchor left/right + inner spread)
  "gardening-land": { x: "11%", y: "50%" },
  "cooking-land":   { x: "33%", y: "50%" },
  "science-land":   { x: "57%", y: "50%" },
  "sports-land":    { x: "82%", y: "50%" },
  // Row 3 — bottom (3 lands, centered across 22%–78%)
  "nilco-zone":     { x: "22%", y: "81%" },
  "beauty-land":    { x: "50%", y: "81%" },
  "handmade-land":  { x: "78%", y: "81%" },
};

const MOBILE_BOTTOM_ROW_SLUGS = new Set(["nilco-zone", "beauty-land", "handmade-land"]);
const MOBILE_MIDDLE_ROW_SLUGS = new Set(["gardening-land", "cooking-land", "science-land", "sports-land"]);
const MOBILE_LAND_LABELS: Record<string, string> = {
  "art-land": "Art",
  "fashion-land": "Fashion",
  "cooking-land": "Cooking",
  "science-land": "Science",
  "lego-building": "Lego",
  "vr-land": "VR",
  "sports-land": "Sports",
  "gardening-land": "Garden",
  "nilco-zone": "Nilco",
  "beauty-land": "Beauty",
  "handmade-land": "Handmade",
};

// Organic blob shape per land (CSS border-radius shorthand)
const BLOB_SHAPES: Record<string, string> = {
  "art-land":       "62% 38% 54% 46% / 48% 52% 42% 58%",
  "fashion-land":   "45% 55% 70% 30% / 60% 40% 52% 48%",
  "cooking-land":   "58% 42% 45% 55% / 52% 48% 65% 35%",
  "science-land":   "35% 65% 52% 48% / 55% 45% 38% 62%",
  "lego-building":  "48% 52% 38% 62% / 42% 58% 55% 45%",
  "vr-land":        "65% 35% 58% 42% / 38% 62% 48% 52%",
  "sports-land":    "52% 48% 65% 35% / 58% 42% 45% 55%",
  "gardening-land": "42% 58% 48% 52% / 65% 35% 58% 42%",
  "nilco-zone":     "55% 45% 42% 58% / 45% 55% 62% 38%",
  "beauty-land":    "68% 32% 55% 45% / 52% 48% 68% 32%",
  "handmade-land":  "38% 62% 62% 38% / 48% 52% 35% 65%",
};

// Smaller blobs so all 11 fit with breathing room
const BLOB_SIZES: Record<number, number> = { 3: 104, 4: 116, 5: 126, 6: 136 };

// ── Decorative elements ─────────────────────────────────────────────────────
// Sparkles sit in the gaps between land rows
const SPARKLES = [
  { x: "24%", y: "34%", size: 8,  delay: 0,    dur: 2.1 },
  { x: "46%", y: "33%", size: 6,  delay: 0.4,  dur: 2.7 },
  { x: "68%", y: "34%", size: 9,  delay: 0.8,  dur: 1.8 },
  { x: "91%", y: "34%", size: 6,  delay: 1.5,  dur: 2.5 },
  { x: "4%",  y: "34%", size: 7,  delay: 1.1,  dur: 2.2 },
  { x: "23%", y: "65%", size: 7,  delay: 0.2,  dur: 2.0 },
  { x: "45%", y: "65%", size: 9,  delay: 1.6,  dur: 2.9 },
  { x: "67%", y: "65%", size: 6,  delay: 0.6,  dur: 2.3 },
  { x: "91%", y: "65%", size: 8,  delay: 1.0,  dur: 1.9 },
  { x: "4%",  y: "65%", size: 6,  delay: 0.3,  dur: 2.6 },
];

// Trees fill the whitespace between the three rows
const TREES = [
  { x: "24%",  y: "33%", e: "🌴", o: 0.42, s: "1.1rem" },
  { x: "45%",  y: "33%", e: "🌲", o: 0.38, s: "1.0rem" },
  { x: "67%",  y: "33%", e: "🌴", o: 0.42, s: "1.1rem" },
  { x: "90%",  y: "33%", e: "🌲", o: 0.38, s: "1.0rem" },
  { x: "5%",   y: "33%", e: "🌳", o: 0.40, s: "1.0rem" },
  { x: "22%",  y: "65%", e: "🌲", o: 0.42, s: "1.1rem" },
  { x: "44%",  y: "65%", e: "🌴", o: 0.38, s: "1.0rem" },
  { x: "66%",  y: "65%", e: "🌳", o: 0.42, s: "1.1rem" },
  { x: "90%",  y: "65%", e: "🌴", o: 0.38, s: "1.0rem" },
  { x: "5%",   y: "65%", e: "🌲", o: 0.40, s: "1.0rem" },
];

// ── Color helpers ───────────────────────────────────────────────────────────
function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ── Sub-components ──────────────────────────────────────────────────────────
function PlayLeagueCrown() {
  return (
    <motion.div
      style={{ position: "absolute", top: -15, right: -10, fontSize: "1.3rem", filter: "drop-shadow(0 0 8px rgba(212,168,67,0.9))", zIndex: 10 }}
      animate={{ scale: [1, 1.25, 1], rotate: [-6, 6, -6] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      🏆
    </motion.div>
  );
}

function AmbientGlow({ land, pos }: { land: Land; pos: { x: string; y: string } }) {
  return (
    <div style={{
      position: "absolute", left: pos.x, top: pos.y,
      width: 200, height: 200, transform: "translate(-50%, -50%)",
      background: `radial-gradient(ellipse at center, ${land.theme_color}40 0%, ${land.theme_color}18 45%, transparent 72%)`,
      filter: "blur(24px)", pointerEvents: "none", zIndex: 0,
    }} />
  );
}

function LandHoverCard({ land, challenge }: { land: Land; challenge?: PlayLeagueChallenge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{
        position: "absolute", bottom: "112%", left: "50%", transform: "translateX(-50%)",
        width: 232, zIndex: 100,
        background: "rgba(6,14,6,0.97)", backdropFilter: "blur(16px)",
        border: `1.5px solid ${land.theme_color}55`, borderRadius: 18, padding: "0.9rem 1rem",
        boxShadow: `0 28px 64px rgba(0,0,0,0.65), 0 0 28px ${land.theme_color}28`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: "1.6rem" }}>{land.icon_emoji}</span>
        <span style={{ color: land.theme_color, fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>{land.name}</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.71rem", marginBottom: 8, lineHeight: 1.5 }}>
        {land.description.slice(0, 80)}…
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ background: `${land.theme_color}22`, color: land.theme_color, fontSize: "0.62rem", padding: "3px 9px", borderRadius: 20, fontWeight: 700, border: `1px solid ${land.theme_color}40` }}>
          Ages {land.age_min}–{land.age_max}
        </span>
        <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", fontSize: "0.62rem", padding: "3px 9px", borderRadius: 20, fontWeight: 600 }}>
          {land.stations.length} activities
        </span>
      </div>
      {challenge && (
        <div style={{ background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 10, padding: "6px 9px", marginBottom: 8 }}>
          <div style={{ color: "#D4A843", fontWeight: 800, fontSize: "0.68rem", marginBottom: 2 }}>⚡ PLAY LEAGUE ACTIVE</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.63rem", marginBottom: 2 }}>{challenge.title}</div>
          <div style={{ color: "#D4A843", fontSize: "0.63rem", fontWeight: 700 }}>+{challenge.bonus_points} bonus pts · {challenge.current_participants} competing</div>
        </div>
      )}
      <div style={{ color: "#74a832", fontSize: "0.68rem", marginBottom: 10, fontWeight: 600 }}>
        🌿 Earn 50 pts/hour · {land.is_active ? "✅ Open Now!" : "○ Closed Today"}
      </div>
      <Link href={`/lands/${land.slug}`} style={{
        display: "block", textAlign: "center",
        background: `linear-gradient(135deg, ${land.theme_color}, ${darken(land.theme_color, 22)})`,
        color: "white", padding: "7px 0", borderRadius: 10, fontSize: "0.75rem", fontWeight: 800,
        textDecoration: "none", letterSpacing: "0.04em", boxShadow: `0 4px 16px ${land.theme_color}50`,
      }}>
        Explore {land.name} →
      </Link>
      <div style={{
        position: "absolute", bottom: -9, left: "50%", transform: "translateX(-50%)",
        width: 0, height: 0,
        borderLeft: "9px solid transparent", borderRight: "9px solid transparent",
        borderTop: "9px solid rgba(6,14,6,0.97)",
      }} />
    </motion.div>
  );
}

function LandBlob({ land, challenge, isHovered, dimmed, onHover, onLeave, onClick, scale = 1 }: {
  land: Land; challenge?: PlayLeagueChallenge;
  isHovered: boolean; dimmed: boolean;
  onHover: () => void; onLeave: () => void; onClick: () => void;
  scale?: number;
}) {
  const size = Math.round((BLOB_SIZES[land.stations.length] ?? 158) * scale);
  const shape = BLOB_SHAPES[land.slug] ?? "60% 40% 55% 45% / 45% 55% 40% 60%";
  const isSmallMap = scale < 0.8;
  const displayName = isSmallMap ? (MOBILE_LAND_LABELS[land.slug] ?? land.name) : land.name;

  return (
    <motion.div
      onHoverStart={onHover}
      onHoverEnd={onLeave}
      onClick={onClick}
      animate={{ opacity: dimmed ? 0.18 : 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ opacity: { duration: 0.3 }, scale: { type: "spring", stiffness: 280, damping: 20 } }}
      style={{
        position: "relative", width: size, height: size,
        background: `radial-gradient(ellipse at 33% 33%, ${lighten(land.theme_color, 30)} 0%, ${land.theme_color} 48%, ${darken(land.theme_color, 25)} 100%)`,
        borderRadius: shape,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        border: challenge ? "3px solid #D4A843" : "2px solid rgba(255,255,255,0.14)",
        boxShadow: isHovered
          ? `0 0 52px ${land.theme_color}72, 0 0 100px ${land.theme_color}32, inset 0 1px 0 rgba(255,255,255,0.38)`
          : `0 8px 32px ${land.theme_color}48, 0 2px 10px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.2)`,
        transition: "box-shadow 0.3s ease",
        zIndex: isHovered ? 50 : 1,
        pointerEvents: dimmed ? "none" : "auto",
      }}
    >
      {challenge && <PlayLeagueCrown />}

      {/* Inner highlight (3D lighting crescent) */}
      <div style={{
        position: "absolute", top: "9%", left: "11%", width: "54%", height: "44%",
        background: "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.28) 0%, transparent 68%)",
        pointerEvents: "none", borderRadius: "60% 40% 50% 50%",
      }} />

      {/* Floating emoji */}
      <motion.span
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: size > 120 ? "2.4rem" : "2rem", lineHeight: 1, filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.45))" }}
      >
        {land.icon_emoji}
      </motion.span>

      {/* Land name */}
      <span style={{
        color: "white", fontWeight: 900, fontSize: isSmallMap ? "0.58rem" : size > 120 ? "0.7rem" : "0.62rem",
        textTransform: "uppercase", textAlign: "center", letterSpacing: "0.07em",
        marginTop: "0.4rem", textShadow: "0 1px 6px rgba(0,0,0,0.65)", lineHeight: 1.12, maxWidth: isSmallMap ? "92%" : "80%",
      }}>
        {displayName}
      </span>

      {/* Station count */}
      {!isSmallMap && (
        <span style={{ color: "rgba(255,255,255,0.68)", fontSize: "0.58rem", marginTop: "0.2rem", fontWeight: 600 }}>
          {land.stations.length} stations
        </span>
      )}

      {/* Open / Closed badge */}
      <div style={{
        position: "absolute", bottom: -13,
        background: land.is_active ? "#15803d" : "rgba(55,65,81,0.9)",
        color: "white", fontSize: "0.54rem", fontWeight: 800,
        padding: "2px 10px", borderRadius: 12, textTransform: "uppercase", letterSpacing: "0.1em",
        boxShadow: land.is_active ? "0 2px 8px rgba(21,128,61,0.5)" : "none",
        whiteSpace: "nowrap",
      }}>
        {land.is_active ? "● OPEN" : "○ CLOSED"}
      </div>
    </motion.div>
  );
}

function PlayLeagueBanner({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="animate-shimmer"
      style={{
        background: "linear-gradient(90deg, #B8922E 0%, #D4A843 25%, #FF6B47 55%, #D4A843 80%, #B8922E 100%)",
        backgroundSize: "200% 100%",
        padding: "0.75rem clamp(0.85rem, 3vw, 1.5rem)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
        flexWrap: "wrap", borderRadius: "14px 14px 0 0",
        boxShadow: "0 4px 20px rgba(212,168,67,0.35)",
      }}
    >
      <span style={{
        color: "white", fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.04em",
        textShadow: "0 1px 4px rgba(0,0,0,0.3)", textAlign: "center", lineHeight: 1.45,
        maxWidth: 760,
      }}>
        🏆 PLAY LEAGUE IS LIVE! Complete challenges in highlighted lands to compete.
      </span>
      <span style={{ background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.9)", fontSize: "0.72rem", fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
        {count} active challenge{count !== 1 ? "s" : ""}
      </span>
    </motion.div>
  );
}

function Sparkle({ x, y, size, delay, dur }: { x: string; y: string; size: number; delay: number; dur: number }) {
  return (
    <motion.div
      style={{ position: "absolute", left: x, top: y, width: size, height: size, pointerEvents: "none", zIndex: 0 }}
      animate={{ scale: [0, 1, 0], opacity: [0, 0.9, 0], rotate: [0, 180] }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill="#D4A843" />
      </svg>
    </motion.div>
  );
}

function FestivalPaths() {
  // Paths match the 3-row layout:
  // Row 1: Art(14,17)  Fashion(34,17)  Lego(56,17)  VR(78,17)
  // Row 2: Gardening(11,50)  Cooking(33,50)  Science(57,50)  Sports(82,50)
  // Row 3: Nilco(22,81)  Beauty(50,81)  Handmade(78,81)
  const paths = [
    // Row 1 top horizontal
    { d: "M 14,17 C 20,15 28,15 34,17 C 40,19 48,15 56,17 C 62,19 70,15 78,17", stroke: "url(#pg1)", sw: 1.6 },
    // Left spine: Art → Gardening → Nilco
    { d: "M 14,17 C 12,26 11,36 11,50 C 11,62 14,70 22,81",                       stroke: "url(#pg2)", sw: 1.4 },
    // Right spine: VR → Sports → Handmade
    { d: "M 78,17 C 80,26 82,36 82,50 C 82,62 81,70 78,81",                       stroke: "#F48FB1",   sw: 1.4 },
    // Row 2 middle horizontal
    { d: "M 11,50 C 18,48 26,52 33,50 C 40,48 50,52 57,50 C 64,48 74,52 82,50",   stroke: "#81C784",   sw: 1.5 },
    // Row 3 bottom horizontal
    { d: "M 22,81 C 32,79 40,83 50,81 C 60,79 68,83 78,81",                       stroke: "url(#pg1)", sw: 1.5 },
    // Cross-connectors (diagonal feel)
    { d: "M 34,17 C 28,28 20,38 11,50",                                            stroke: "#4FC3F7",   sw: 0.9 },
    { d: "M 56,17 C 60,28 62,38 57,50",                                            stroke: "#FFF176",   sw: 0.9 },
  ];

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
      viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#D4A843" />
          <stop offset="45%"  stopColor="#1ABC9C" />
          <stop offset="100%" stopColor="#74a832" />
        </linearGradient>
        <linearGradient id="pg2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#4FC3F7" />
          <stop offset="55%"  stopColor="#81C784" />
          <stop offset="100%" stopColor="#FFF176" />
        </linearGradient>
        <filter id="pf">
          <feGaussianBlur stdDeviation="0.7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Glow base layers */}
      {paths.map((p, i) => (
        <motion.path key={`base-${i}`} d={p.d} fill="none"
          stroke={p.stroke} strokeWidth={p.sw * 2.5} strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.15 }}
          transition={{ pathLength: { delay: i * 0.18, duration: 1.1, ease: "easeInOut" }, opacity: { delay: i * 0.18, duration: 0.3 } }} />
      ))}

      {/* Main path lines */}
      {paths.map((p, i) => (
        <motion.path key={`line-${i}`} d={p.d} fill="none"
          stroke={p.stroke} strokeWidth={p.sw} strokeLinecap="round"
          strokeDasharray="4 2.5" filter="url(#pf)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.88 }}
          transition={{ pathLength: { delay: i * 0.18, duration: 1.1, ease: "easeInOut" }, opacity: { delay: i * 0.18, duration: 0.3 } }} />
      ))}

      {/* Animated flowing highlight */}
      {paths.slice(0, 4).map((p, i) => (
        <path key={`flow-${i}`} d={p.d} fill="none"
          stroke="rgba(255,255,255,0.28)" strokeWidth={p.sw * 0.5}
          strokeLinecap="round" strokeDasharray="4 2.5"
          style={{ animation: `pathFlow ${2 + i * 0.4}s linear infinite` }}
        />
      ))}
    </svg>
  );
}

function LandListItem({ land, challenge, index, onClick }: { land: Land; challenge?: PlayLeagueChallenge; index: number; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 280, damping: 22 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem",
        background: hov
          ? `linear-gradient(135deg, ${land.theme_color}28 0%, rgba(0,0,0,0.15) 100%)`
          : `linear-gradient(135deg, ${land.theme_color}14 0%, rgba(0,0,0,0.18) 100%)`,
        borderRadius: 16, border: `1px solid ${hov ? land.theme_color + "55" : land.theme_color + "28"}`,
        cursor: "pointer", marginBottom: "0.6rem", transition: "all 0.2s ease",
        boxShadow: hov ? `0 4px 20px ${land.theme_color}30` : "none",
      }}
    >
      <span style={{ fontSize: "2.2rem" }}>{land.icon_emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: "white", fontWeight: 800, fontSize: "0.9rem" }}>{land.name}</div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.71rem" }}>
          {land.stations.length} stations · Ages {land.age_min}–{land.age_max}
        </div>
      </div>
      {challenge && <span title="Play League Active" style={{ fontSize: "1.1rem" }}>🏆</span>}
      <span style={{ color: land.is_active ? "#22c55e" : "rgba(255,255,255,0.28)", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.08em" }}>
        {land.is_active ? "OPEN" : "CLOSED"}
      </span>
      <span style={{ color: land.theme_color, fontWeight: 800, fontSize: "1.1rem" }}>→</span>
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface FestivalMapProps {
  activeFilter?: FilterKey;
  compact?: boolean;
  forceMap?: boolean;
  showViewToggle?: boolean;
  openLandIds?: string[] | null;
}

interface TooltipTarget {
  land: Land;
  challenge?: PlayLeagueChallenge;
  x: number;
  y: number;
}

export default function FestivalMap({
  activeFilter = "all",
  compact = false,
  forceMap = false,
  showViewToggle = true,
  openLandIds = null,
}: FestivalMapProps) {
  const router = useRouter();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [tooltipTarget, setTooltipTarget] = useState<TooltipTarget | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const blobRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const updateLayout = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile && !forceMap) setViewMode("list");
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    setMounted(true);
    return () => window.removeEventListener("resize", updateLayout);
  }, [forceMap]);

  if (!mounted) return null;

  const challengeMap = Object.fromEntries(MOCK_CHALLENGES.map((c) => [c.land_slug, c]));
  const effectiveViewMode = forceMap ? "map" : viewMode;
  const mapMinHeight = compact ? (isMobile ? 470 : 560) : (isMobile ? 610 : 800);
  const blobScale = isMobile ? 0.56 : 1;
  const runtimeLands = LANDS.map((land) => ({
    ...land,
    is_active: openLandIds ? openLandIds.includes(land.id) : land.is_active,
  }));

  function getLandPosition(slug: string) {
    const pos = LAND_POSITIONS[slug];
    if (!pos || !isMobile) return pos;
    if (slug === "sports-land") return { ...pos, x: "78%", y: "42%" };
    if (MOBILE_BOTTOM_ROW_SLUGS.has(slug)) return { ...pos, y: "66%" };
    if (MOBILE_MIDDLE_ROW_SLUGS.has(slug)) return { ...pos, y: "42%" };
    return { ...pos, y: "14%" };
  }

  function isVisible(land: Land): boolean {
    if (activeFilter === "open")  return land.is_active;
    if (activeFilter === "young") return land.age_min <= 8;
    if (activeFilter === "older") return land.age_max >= 8;
    return true;
  }

  const visibleLandsCount = runtimeLands.reduce((count, land) => count + (isVisible(land) ? 1 : 0), 0);

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
      {/* Play League banner */}
      <PlayLeagueBanner count={MOCK_CHALLENGES.length} />

      {/* View toggle bar */}
      {showViewToggle && !forceMap && (
      <div style={{
        display: "flex", gap: "0.5rem", padding: "0.65rem 1rem",
        background: "rgba(0,0,0,0.45)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        justifyContent: "flex-end", alignItems: "center",
      }}>
        <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.7rem", marginRight: "0.25rem" }}>View:</span>
        {([{ id: "map", label: "🗺 Map" }, { id: "list", label: "📋 List" }] as const).map((opt) => (
          <button key={opt.id} onClick={() => setViewMode(opt.id)} style={{
            background: viewMode === opt.id ? "#FF6B47" : "rgba(255,255,255,0.07)",
            color: viewMode === opt.id ? "white" : "rgba(255,255,255,0.45)",
            border: "none", borderRadius: 20, padding: "4px 14px",
            fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
          }}>
            {opt.label}
          </button>
        ))}
      </div>
      )}

      {/* ── MAP VIEW ── */}
      <AnimatePresence mode="wait">
        {effectiveViewMode === "map" && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "relative", width: "100%", minHeight: mapMinHeight, overflow: "hidden",
              background: `
                radial-gradient(ellipse 65% 45% at 50% 28%, rgba(72,105,62,0.42) 0%, transparent 62%),
                radial-gradient(ellipse 82% 58% at 18% 72%, rgba(43,88,37,0.32) 0%, transparent 52%),
                radial-gradient(ellipse 42% 32% at 82% 82%, rgba(28,68,23,0.22) 0%, transparent 52%),
                linear-gradient(158deg, #1a2f1a 0%, #0f2010 42%, #091808 100%)
              `,
            }}
          >
            {/* Ground texture SVG overlay */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.04, zIndex: 0 }}
              viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
              <filter id="gt">
                <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="200" height="200" filter="url(#gt)" />
            </svg>

            {/* Sparkles */}
            {SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

            {/* Trees */}
            {TREES.map((t, i) => (
              <div key={i} style={{
                position: "absolute", left: t.x, top: t.y, fontSize: t.s,
                opacity: t.o, pointerEvents: "none", zIndex: 0, transform: "translate(-50%,-50%)",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
              }}>{t.e}</div>
            ))}

            {/* Ambient glow pools */}
            {runtimeLands.map((land) => {
              const pos = getLandPosition(land.slug);
              return pos ? <AmbientGlow key={land.id} land={land} pos={pos} /> : null;
            })}

            {/* Festival pathways */}
            <FestivalPaths />

            {/* Land blobs */}
            {runtimeLands.map((land, i) => {
              const pos = getLandPosition(land.slug);
              if (!pos) return null;
              return (
                <motion.div key={land.id}
                  ref={(el) => { blobRefs.current[land.id] = el; }}
                  style={{ position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%,-50%)", zIndex: hoveredSlug === land.slug ? 60 : 2 }}
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 20 }}
                >
                  <LandBlob
                    land={land}
                    challenge={challengeMap[land.slug]}
                    isHovered={hoveredSlug === land.slug}
                    dimmed={!isVisible(land)}
                    scale={blobScale}
                    onHover={() => {
                      const el = blobRefs.current[land.id];
                      if (el) {
                        const rect = el.getBoundingClientRect();
                        setTooltipTarget({
                          land,
                          challenge: challengeMap[land.slug],
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }
                      setHoveredSlug(land.slug);
                    }}
                    onLeave={() => { setTooltipTarget(null); setHoveredSlug(null); }}
                    onClick={() => router.push(`/lands/${land.slug}`)}
                  />
                </motion.div>
              );
            })}

            {/* Entrance arch marker */}
            {!isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, type: "spring", stiffness: 200, damping: 20 }}
              style={{ position: "absolute", left: "50%", bottom: "1.5%", transform: "translateX(-50%)", textAlign: "center", zIndex: 5 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 60, height: 60, borderRadius: "50%", margin: "0 auto",
                  background: "radial-gradient(ellipse at 35% 35%, #FF8A6B, #FF6B47, #E55A38)",
                  border: "3px solid #D4A843", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 28px rgba(255,107,71,0.65), 0 0 56px rgba(212,168,67,0.3)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🏟</span>
              </motion.div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.55)", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                ENTRANCE
              </div>
            </motion.div>
            )}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 240, damping: 24 }}
                style={{
                  position: "absolute", left: 10, right: 10, bottom: 10, zIndex: 8,
                  minHeight: 56, padding: "0.55rem 0.65rem",
                  borderRadius: 16,
                  display: "flex", alignItems: "center", gap: "0.7rem",
                  background: "linear-gradient(135deg, rgba(9,24,8,0.92), rgba(26,47,26,0.82))",
                  border: "1px solid rgba(212,168,67,0.34)",
                  boxShadow: "0 14px 36px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 38, height: 38, borderRadius: "50%", flex: "0 0 auto",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "radial-gradient(ellipse at 35% 35%, #FF8A6B, #FF6B47, #E55A38)",
                    border: "2px solid #D4A843",
                    boxShadow: "0 0 20px rgba(255,107,71,0.48)",
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>ðŸŸ</span>
                </motion.div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#D4A843", fontSize: "0.68rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Entrance
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.7rem", lineHeight: 1.3, fontWeight: 600 }}>
                    Main gate to all lands and daily challenges.
                  </div>
                </div>
                <div style={{
                  flex: "0 0 auto", color: "rgba(255,255,255,0.78)", fontSize: "0.68rem", fontWeight: 800,
                  padding: "0.28rem 0.55rem", borderRadius: 999, background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {visibleLandsCount}/11
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── LIST VIEW ── */}
        {effectiveViewMode === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "linear-gradient(158deg, #1a2f1a 0%, #091808 100%)", padding: "1.25rem", minHeight: compact ? 400 : 580 }}
          >
            {runtimeLands.filter(isVisible).map((land, i) => (
              <LandListItem key={land.id} land={land} challenge={challengeMap[land.slug]} index={i}
                onClick={() => router.push(`/lands/${land.slug}`)} />
            ))}
            {runtimeLands.filter(isVisible).length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.38)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                <div>No lands match this filter right now.</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Portal tooltip — renders into document.body, never clipped ── */}
      {createPortal(
        <AnimatePresence>
          {tooltipTarget && (
            <motion.div
              key={tooltipTarget.land.id}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              style={{
                position: "fixed",
                left: tooltipTarget.x,
                top: tooltipTarget.y - 14,
                transform: "translateX(-50%) translateY(-100%)",
                zIndex: 9999,
                pointerEvents: "none",
              }}
            >
              <LandHoverCard land={tooltipTarget.land} challenge={tooltipTarget.challenge} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
