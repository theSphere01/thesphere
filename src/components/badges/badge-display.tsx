"use client";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { getRarityColor } from "@/lib/utils";
import type { BadgeDefinition } from "@/lib/types";

interface Props {
  badge: BadgeDefinition;
  earned?: boolean;
  earnedAt?: string;
  animated?: boolean;
}

const RARITY_BG: Record<string, string> = {
  common:    "rgba(148, 163, 184, 0.08)",
  rare:      "rgba(52, 152, 219, 0.12)",
  epic:      "rgba(155, 89, 182, 0.14)",
  legendary: "rgba(212, 168, 67, 0.16)",
};

const badgeCelebration = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: {
    scale: [0, 1.4, 0.9, 1.1, 1],
    rotate: [-180, 10, -5, 3, 0],
    opacity: [0, 1, 1, 1, 1],
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

export default function BadgeDisplay({ badge, earned = false, earnedAt, animated = false }: Props) {
  const borderColor = getRarityColor(badge.rarity);
  const bgColor = RARITY_BG[badge.rarity] ?? RARITY_BG.common;
  const isLegendary = badge.rarity === "legendary";

  const card = (
    <div
      title={earned ? badge.description : `Locked — ${badge.description}`}
      style={{
        position: "relative",
        width: 96,
        height: 96,
        borderRadius: 16,
        border: `2px solid ${earned ? borderColor : "rgba(100,116,139,0.3)"}`,
        background: earned ? bgColor : "rgba(15,15,26,0.6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "8px 4px 6px",
        filter: earned ? "none" : "grayscale(1) blur(0.5px)",
        opacity: earned ? 1 : 0.45,
        cursor: "default",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        boxShadow: earned && isLegendary
          ? `0 0 18px 4px rgba(212,168,67,0.35), 0 0 6px 1px ${borderColor}`
          : earned
          ? `0 0 10px 2px ${borderColor}40`
          : "none",
      }}
    >
      {/* Lock overlay for unearned */}
      {!earned && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10,10,20,0.4)",
            zIndex: 2,
          }}
        >
          <Lock size={18} color="rgba(148,163,184,0.7)" />
        </div>
      )}

      {/* Rarity dot */}
      <span
        style={{
          position: "absolute",
          top: 5,
          right: 6,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: earned ? borderColor : "rgba(100,116,139,0.4)",
        }}
      />

      {/* Emoji */}
      <span style={{ fontSize: "2rem", lineHeight: 1, zIndex: 1 }}>{badge.emoji}</span>

      {/* Name */}
      <span
        className={isLegendary && earned ? "shimmer-gold" : undefined}
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: "0.03em",
          color: isLegendary && earned ? undefined : earned ? "var(--color-surface)" : "var(--color-text-muted)",
          maxWidth: 82,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          zIndex: 1,
        }}
      >
        {badge.name}
      </span>

      {/* Earned date */}
      {earned && earnedAt && (
        <span
          style={{
            position: "absolute",
            bottom: 4,
            fontSize: "0.5rem",
            color: "rgba(148,163,184,0.5)",
          }}
        >
          {new Date(earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      )}
    </div>
  );

  if (animated && earned) {
    return (
      <motion.div
        initial={badgeCelebration.initial}
        animate={badgeCelebration.animate}
        style={{ display: "inline-block" }}
      >
        {card}
      </motion.div>
    );
  }

  return card;
}
