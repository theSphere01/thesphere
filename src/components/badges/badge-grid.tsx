"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import BadgeDisplay from "./badge-display";

interface Props {
  earnedBadgeIds: string[];
  animated?: boolean;
}

const CATEGORIES = [
  { key: "all",     label: "All" },
  { key: "visits",  label: "Visits" },
  { key: "streaks", label: "Streaks" },
  { key: "points",  label: "Points" },
  { key: "explorer",label: "Explorer" },
  { key: "land",    label: "Lands" },
  { key: "special", label: "Special" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function BadgeGrid({ earnedBadgeIds, animated = false }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showOnly, setShowOnly] = useState<"all" | "earned">("all");

  const earnedSet = new Set(earnedBadgeIds);
  const earnedCount = BADGE_DEFINITIONS.filter((b) => earnedSet.has(b.id)).length;

  const filtered = BADGE_DEFINITIONS.filter((b) => {
    const categoryMatch = activeFilter === "all" || b.category === activeFilter;
    const earnedMatch = showOnly === "all" || earnedSet.has(b.id);
    return categoryMatch && earnedMatch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <span
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-sphere-coral)",
          }}
        >
          {earnedCount} / {BADGE_DEFINITIONS.length} Earned
        </span>
        {/* Earned toggle */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["all", "earned"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setShowOnly(opt)}
              style={{
                padding: "0.3rem 0.9rem",
                borderRadius: 999,
                border: `1.5px solid ${showOnly === opt ? "var(--color-sphere-coral)" : "rgba(255,255,255,0.12)"}`,
                background: showOnly === opt ? "var(--color-sphere-coral)" : "transparent",
                color: showOnly === opt ? "#fff" : "var(--color-text-muted)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {opt === "all" ? "All" : "Earned"}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveFilter(cat.key)}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: 999,
              border: `1.5px solid ${activeFilter === cat.key ? "var(--color-sphere-gold)" : "rgba(255,255,255,0.1)"}`,
              background: activeFilter === cat.key ? "rgba(212,168,67,0.15)" : "transparent",
              color: activeFilter === cat.key ? "var(--color-sphere-gold)" : "var(--color-text-muted)",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <motion.div
        key={`${activeFilter}-${showOnly}`}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
          gap: "0.875rem",
        }}
      >
        {filtered.map((badge) => (
          <motion.div key={badge.id} variants={itemVariants}>
            <BadgeDisplay
              badge={badge}
              earned={earnedSet.has(badge.id)}
              animated={animated && earnedSet.has(badge.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
          }}
        >
          No badges in this category yet.
        </div>
      )}
    </div>
  );
}
