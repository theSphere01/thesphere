"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Star, Zap, Award } from "lucide-react";
import { LANDS, BADGE_DEFINITIONS, DEFAULT_POINTS_CONFIG } from "@/lib/constants";
import { hexToRgba, getAgeLabel } from "@/lib/utils";
import { StationCard } from "@/components/lands/station-card";
import { PhotoGallery } from "@/components/lands/photo-gallery";

interface LandPageProps {
  params: Promise<{ slug: string }>;
}

const POINTS_ROWS = [
  { hours: 1, base: DEFAULT_POINTS_CONFIG.per_hour,                              label: "1 hour",   bonus: null },
  { hours: 2, base: DEFAULT_POINTS_CONFIG.per_hour * 2 + DEFAULT_POINTS_CONFIG.bonus_2h, label: "2 hours",  bonus: `+${DEFAULT_POINTS_CONFIG.bonus_2h} bonus` },
  { hours: 3, base: DEFAULT_POINTS_CONFIG.per_hour * 3 + DEFAULT_POINTS_CONFIG.bonus_3h, label: "3 hours",  bonus: `+${DEFAULT_POINTS_CONFIG.bonus_3h} bonus` },
  { hours: 5, base: DEFAULT_POINTS_CONFIG.per_hour * 5 + DEFAULT_POINTS_CONFIG.bonus_5h, label: "5 hours",  bonus: `+${DEFAULT_POINTS_CONFIG.bonus_5h} bonus` },
];

export default function LandPage({ params }: LandPageProps) {
  const { slug } = use(params);
  const land = LANDS.find((l) => l.slug === slug);
  if (!land) notFound();

  const color = land.theme_color;
  const fadeBg = `linear-gradient(160deg, ${color} 0%, ${hexToRgba(color, 0.5)} 40%, var(--color-dark) 100%)`;
  const landBadge = BADGE_DEFINITIONS.find(
    (b) => b.criteria_land_slug === slug && b.criteria_type === "land_visits"
  );

  const getRarityLabel = (rarity: string) => {
    const map: Record<string, string> = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };
    return map[rarity] ?? rarity;
  };

  const getRarityGlow = (rarity: string) => {
    const map: Record<string, string> = {
      common: "rgba(148,163,184,0.3)",
      rare: "rgba(52,152,219,0.4)",
      epic: "rgba(155,89,182,0.4)",
      legendary: "rgba(212,168,67,0.5)",
    };
    return map[rarity] ?? map.common;
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-dark)" }}>
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "55vh", background: fadeBg }}>
        {/* Decorative glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{ background: color }} />
        </div>

        {/* Back link */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6">
          <Link href="/lands"
            className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "rgba(255,255,255,0.7)" }}>
            <ArrowLeft size={16} />
            All Lands
          </Link>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6 pb-10 flex flex-col items-center text-center gap-4">
          {/* Giant floating emoji */}
          <motion.span
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "clamp(4rem,15vw,8rem)", lineHeight: 1, filter: `drop-shadow(0 8px 24px ${hexToRgba(color, 0.5)})`, userSelect: "none" }}
          >
            {land.icon_emoji}
          </motion.span>

          {/* Land name — always visible, no opacity animation */}
          <h1
            className="font-black text-white leading-tight"
            style={{ fontSize: "clamp(2.2rem,8vw,5rem)", textShadow: `0 4px 24px ${hexToRgba(color, 0.6)}`, margin: 0 }}
          >
            {land.name}
          </h1>

          {/* Tagline */}
          <p
            className="italic font-light max-w-xl"
            style={{ fontSize: "clamp(1rem,4vw,1.4rem)", color: "var(--color-sphere-gold)", margin: 0 }}
          >
            "{land.tagline}"
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: <Star size={14} />, label: getAgeLabel(land.age_min, land.age_max) },
              { icon: <Zap size={14} />, label: `${land.stations.length} Activities` },
              { icon: <Clock size={14} />, label: "50 pts / hour" },
            ].map((stat, i) => (
              <span key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}>
                {stat.icon}
                {stat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATIONS SECTION ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ color }}>
            What You'll Do
          </h2>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.72)" }}>
            {land.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {land.stations.map((station, i) => (
            <StationCard
              key={station.id}
              station={station}
              themeColor={color}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(color, 0.5)}, transparent)` }} />
      </div>

      {/* ── POINTS SECTION ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-black mb-2" style={{ color }}>
            What You'll Earn
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)" }}>
            Every minute in {land.name} builds your score. Stay longer, earn more.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {POINTS_ROWS.map((row, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${hexToRgba(color, 0.35)}` }}
              className="rounded-2xl p-5 text-center"
              style={{ background: hexToRgba(color, 0.15), border: `1px solid ${hexToRgba(color, 0.35)}` }}
            >
              <div className="text-3xl font-black mb-1" style={{ color }}>
                {row.base}
              </div>
              <div className="text-xs font-bold text-white uppercase tracking-wide mb-1">pts</div>
              <div className="text-sm font-semibold text-white">{row.label}</div>
              {row.bonus && (
                <div className="text-xs mt-1.5 px-2 py-0.5 rounded-full inline-block"
                  style={{ background: hexToRgba(color, 0.2), color }}>
                  {row.bonus}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Extra bonuses */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "First Visit to This Land", pts: DEFAULT_POINTS_CONFIG.new_land, emoji: "🆕" },
            { label: "Return Visit Bonus",        pts: DEFAULT_POINTS_CONFIG.return_visit, emoji: "🔄" },
            { label: "3-Day Streak Multiplier",   pts: null, extra: "1.3x", emoji: "🔥" },
          ].map((bonus, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <span className="text-2xl">{bonus.emoji}</span>
              <div>
                <div className="text-sm text-white font-semibold">{bonus.label}</div>
                <div className="text-sm font-bold mt-0.5" style={{ color }}>
                  {bonus.pts !== null ? `+${bonus.pts} pts` : bonus.extra}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(color, 0.5)}, transparent)` }} />
      </div>

      {/* ── BADGE SECTION ── */}
      {landBadge && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-8" style={{ color }}>
              Badge to Earn
            </h2>

            <motion.div
              whileHover={{ scale: 1.04, boxShadow: `0 12px 48px ${getRarityGlow(landBadge.rarity)}` }}
              className="inline-flex items-center gap-6 p-6 rounded-2xl max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(color, 0.15)} 0%, rgba(255,255,255,0.04) 100%)`,
                border: `2px solid ${hexToRgba(color, 0.4)}`,
              }}
            >
              <motion.span
                animate={{ rotate: [0, -5, 5, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl"
              >
                {landBadge.emoji}
              </motion.span>
              <div>
                <div className="text-xl font-black text-white mb-1">{landBadge.name}</div>
                <div className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {landBadge.description}
                </div>
                <div className="flex items-center gap-2">
                  <Award size={13} style={{ color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {getRarityLabel(landBadge.rarity)} Badge
                  </span>
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Visit {landBadge.criteria_value} times to unlock
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${hexToRgba(color, 0.5)}, transparent)` }} />
      </div>

      {/* ── GALLERY SECTION ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-3xl md:text-4xl font-black mb-6" style={{ color }}>
          Photos
        </h2>
        <PhotoGallery landId={land.id} landColor={color} landEmoji={land.icon_emoji} />
      </section>

      {/* ── CTA SECTION ── */}
      <section
        className="py-16 px-4 text-center"
        style={{ background: `linear-gradient(to bottom, var(--color-dark), ${hexToRgba(color, 0.15)}, var(--color-dark))` }}
      >
        <div className="max-w-xl mx-auto">
          <div className="text-6xl mb-4">{land.icon_emoji}</div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Ready to explore <span style={{ color }}>{land.name}</span>?
          </h2>
          <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
            Register, get your NFC wristband, and start earning points today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
              className="block px-8 py-4 rounded-2xl text-lg font-bold text-white"
              style={{ background: color, touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
              Register to Play
            </Link>
            <Link href="/leaderboard"
              className="block px-8 py-4 rounded-2xl text-lg font-semibold"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
