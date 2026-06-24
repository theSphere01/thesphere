"use client";

import { motion } from "framer-motion";
import { hexToRgba } from "@/lib/utils";
import type { Station } from "@/lib/types";

interface StationCardProps {
  station: Station;
  themeColor: string;
  index?: number;
}

export function StationCard({ station, themeColor, index = 0 }: StationCardProps) {
  const isAgeRestricted = station.age_min >= 8;
  const glowColor = hexToRgba(themeColor, 0.3);

  return (
    <motion.div
      initial={{ x: -16 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.06 }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 8px 32px ${glowColor}, 0 0 0 1px ${hexToRgba(themeColor, 0.25)}`,
      }}
      className="rounded-xl p-5 flex gap-4 items-start"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: `1px solid rgba(255,255,255,0.1)`,
        borderLeft: `4px solid ${themeColor}`,
        opacity: station.is_active ? 1 : 0.5,
      }}
    >
      {/* Emoji */}
      <span className="text-3xl flex-shrink-0 mt-0.5" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}>
        {station.emoji}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4 className="font-bold text-white leading-tight">{station.name}</h4>
          {!station.is_active && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.08)", color: "var(--color-text-muted)" }}>
              Inactive
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed line-clamp-2"
          style={{ color: "rgba(255,255,255,0.65)" }}>
          {station.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          {isAgeRestricted ? (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
              Ages {station.age_min}+ Only
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: hexToRgba(themeColor, 0.12), color: themeColor, border: `1px solid ${hexToRgba(themeColor, 0.25)}` }}>
              Ages {station.age_min}–{station.age_max}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
