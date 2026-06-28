"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Medal, Star, Trophy } from "lucide-react";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import { getRarityColor } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "visits", label: "Visits" },
  { key: "streaks", label: "Streaks" },
  { key: "points", label: "Points" },
  { key: "explorer", label: "Explorer" },
  { key: "land", label: "Lands" },
  { key: "special", label: "Special" },
];

const STAT_CARDS = [
  { label: "Total Badges", value: BADGE_DEFINITIONS.length, icon: Award, color: "var(--color-sphere-coral)" },
  { label: "Land Badges", value: BADGE_DEFINITIONS.filter((badge) => badge.category === "land").length, icon: Medal, color: "var(--color-ws-blue)" },
  { label: "Legendary", value: BADGE_DEFINITIONS.filter((badge) => badge.rarity === "legendary").length, icon: Trophy, color: "var(--color-sphere-gold)" },
  { label: "Point Goals", value: BADGE_DEFINITIONS.filter((badge) => badge.category === "points").length, icon: Star, color: "var(--color-ws-green)" },
];

export default function AdminBadgesPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const badges = BADGE_DEFINITIONS.filter((badge) => activeFilter === "all" || badge.category === activeFilter);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Badges</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Review the badge catalog campers can unlock through visits, points, streaks, and land play.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: `${color}22`, color }}>
                <Icon size={20} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>
                {label}
              </div>
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              style={active
                ? { background: "var(--color-sphere-coral)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {badges.map((badge, index) => {
          const rarityColor = getRarityColor(badge.rarity);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.045)",
                border: `1px solid ${rarityColor}55`,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: `${rarityColor}18`, border: `1px solid ${rarityColor}45` }}
                >
                  {badge.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-base font-black text-white">{badge.name}</h2>
                    <span
                      className="px-2 py-0.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider"
                      style={{ background: `${rarityColor}18`, color: rarityColor, border: `1px solid ${rarityColor}35` }}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.58)" }}>
                    {badge.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}>
                      {badge.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}>
                      {badge.criteria_type}: {badge.criteria_value}
                    </span>
                    {badge.criteria_land_slug && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: `${rarityColor}12`, color: rarityColor }}>
                        {badge.criteria_land_slug}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
