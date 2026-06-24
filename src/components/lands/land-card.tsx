"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { hexToRgba, getAgeLabel } from "@/lib/utils";

type Station = {
  id: string;
  name: string;
  emoji: string;
};

type LandCardLand = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  theme_color: string;
  icon_emoji: string;
  age_min: number;
  age_max: number;
  is_active: boolean;
  stations: readonly Station[];
};

interface LandCardProps {
  land: LandCardLand;
  isOpenToday?: boolean;
  index?: number;
}

export function LandCard({ land, isOpenToday = true, index = 0 }: LandCardProps) {
  const glowColor = hexToRgba(land.theme_color, 0.45);
  const headerBg = `linear-gradient(135deg, ${land.theme_color} 0%, ${hexToRgba(land.theme_color, 0.7)} 100%)`;
  const visibleStations = land.stations.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, delay: index * 0.07 }}
      whileHover={{
        scale: 1.03,
        boxShadow: `0 12px 40px ${glowColor}, 0 0 0 1px ${hexToRgba(land.theme_color, 0.3)}`,
        y: -4,
      }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ boxShadow: `0 4px 20px ${hexToRgba(land.theme_color, 0.15)}` }}
    >
      <Link href={`/lands/${land.slug}`} className="block h-full">
        {/* Top hero section */}
        <div
          className="relative flex flex-col items-center justify-center py-10 px-6"
          style={{ background: headerBg, minHeight: "180px" }}
        >
          {/* Open / Closed badge */}
          <div className="absolute top-3 right-3">
            {isOpenToday ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(0,0,0,0.35)", color: "#6ee7b7", backdropFilter: "blur(8px)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Open Today
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(0,0,0,0.45)", color: "#94a3b8", backdropFilter: "blur(8px)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                Closed
              </span>
            )}
          </div>

          {/* Closed overlay */}
          {!isOpenToday && (
            <div className="absolute inset-0 rounded-t-2xl" style={{ background: "rgba(0,0,0,0.4)" }} />
          )}

          {/* Floating emoji */}
          <motion.span
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl select-none relative z-10"
            style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
          >
            {land.icon_emoji}
          </motion.span>
        </div>

        {/* Bottom content section */}
        <div
          className="p-5 flex flex-col gap-3"
          style={{ background: "var(--color-dark)", minHeight: "200px" }}
        >
          {/* Name */}
          <h3 className="text-xl font-bold text-white leading-tight">{land.name}</h3>

          {/* Tagline */}
          <p className="text-sm leading-snug" style={{ color: "var(--color-text-muted)" }}>
            {land.tagline}
          </p>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: hexToRgba(land.theme_color, 0.18), color: land.theme_color, border: `1px solid ${hexToRgba(land.theme_color, 0.3)}` }}>
              {getAgeLabel(land.age_min, land.age_max)}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.07)", color: "var(--color-text-muted)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {land.stations.length} Activities
            </span>
          </div>

          {/* Station chips */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {visibleStations.map((station) => (
              <span key={station.id}
                className="px-2 py-0.5 rounded-md text-xs"
                style={{ background: hexToRgba(land.theme_color, 0.12), color: land.theme_color }}>
                {station.emoji} {station.name}
              </span>
            ))}
            {land.stations.length > 3 && (
              <span className="px-2 py-0.5 rounded-md text-xs"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-muted)" }}>
                +{land.stations.length - 3} more
              </span>
            )}
          </div>

          {/* CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="mt-auto pt-2"
          >
            <span
              className="block w-full text-center py-2.5 px-4 rounded-xl text-sm font-bold text-white"
              style={{ background: land.theme_color }}
            >
              Explore Land &rarr;
            </span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}
