"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { hexToRgba } from "@/lib/utils";

interface LandPreview {
  id: string;
  name: string;
  slug: string;
  theme_color: string;
  icon_emoji: string;
  age_min: number;
  age_max: number;
  tagline: string;
  stations: unknown[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

const floatDurations = [3, 4, 3.5, 4.5, 3.2, 4.2, 3.8, 4, 3.6, 4.3, 3.4];

export default function LandCardPreview({ land, index }: { land: LandPreview; index: number }) {
  const floatDuration = floatDurations[index % floatDurations.length];

  return (
    <motion.div variants={itemVariants}>
      <Link href={`/lands/${land.slug}`} style={{ textDecoration: "none" }}>
        <motion.div
          whileHover={{
            scale: 1.04,
            boxShadow: `0 12px 40px ${hexToRgba(land.theme_color, 0.35)}, 0 0 0 1px ${hexToRgba(land.theme_color, 0.2)}`,
          }}
          whileTap={{ scale: 0.98 }}
          style={{
            borderRadius: "16px",
            padding: "1.5rem",
            background: hexToRgba(land.theme_color, 0.1),
            border: `1px solid ${hexToRgba(land.theme_color, 0.25)}`,
            borderLeft: `4px solid ${land.theme_color}`,
            cursor: "pointer",
            transition: "box-shadow 0.3s",
          }}
        >
          {/* Emoji */}
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "3rem", marginBottom: "0.75rem", display: "block" }}
          >
            {land.icon_emoji}
          </motion.div>

          {/* Name */}
          <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "white", marginBottom: "0.25rem" }}>
            {land.name}
          </div>

          {/* Tagline */}
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              marginBottom: "0.75rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {land.tagline}
          </div>

          {/* Badges row */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                background: hexToRgba(land.theme_color, 0.25),
                color: land.theme_color,
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                border: `1px solid ${hexToRgba(land.theme_color, 0.35)}`,
              }}
            >
              Ages {land.age_min}–{land.age_max}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.7rem",
                fontWeight: 500,
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
              }}
            >
              {(land.stations as unknown[]).length} stations
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
