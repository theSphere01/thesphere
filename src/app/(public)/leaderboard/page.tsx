"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, TrendingUp, TrendingDown, Flame, Trophy, Medal } from "lucide-react";
import { formatPoints, generateInitials, getRankColor, getRankSuffix } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

type BoardType = "season" | "today";

const RANK_SHADOWS: Record<number, string> = {
  1: "0 0 32px 8px rgba(255,215,0,0.35), 0 0 12px 3px rgba(255,215,0,0.2)",
  2: "0 0 24px 6px rgba(192,192,192,0.3)",
  3: "0 0 20px 4px rgba(205,127,50,0.3)",
};

const RANK_BORDERS: Record<number, string> = {
  1: "2px solid rgba(255,215,0,0.6)",
  2: "2px solid rgba(192,192,192,0.5)",
  3: "2px solid rgba(205,127,50,0.5)",
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={22} color="var(--color-rank-gold)" />;
  if (rank === 2) return <Medal size={20} color="var(--color-rank-silver)" />;
  if (rank === 3) return <Medal size={20} color="var(--color-rank-bronze)" />;
  return null;
}

function PositionIndicator({ current, previous }: { current: number; previous?: number }) {
  if (!previous || previous === current) {
    return <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>—</span>;
  }
  if (previous > current) {
    return <TrendingUp size={14} color="#4ade80" />;
  }
  return <TrendingDown size={14} color="#f87171" />;
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.875rem 1rem",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <div style={{ width: 28, height: 20, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: "60%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.08)", marginBottom: 6 }} />
        <div style={{ width: "40%", height: 11, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div style={{ width: 64, height: 20, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

export default function LeaderboardPage() {
  const [boardType, setBoardType] = useState<BoardType>("season");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchLeaderboard(type: BoardType) {
    try {
      const res = await fetch(`/api/leaderboard?type=${type}`);
      const json = await res.json() as { data?: LeaderboardEntry[]; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to load");
      setEntries(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(boardType);

    // Auto-refresh every 30s
    intervalRef.current = setInterval(() => {
      fetchLeaderboard(boardType);
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [boardType]);

  const top3    = entries.slice(0, 3);
  const rest    = entries.slice(3);

  return (
    <div
      className="theme-dark"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at top, rgba(212,168,67,0.08) 0%, var(--color-dark) 55%)`,
        paddingBottom: "4rem",
      }}
    >
      {/* Hero section */}
      <div
        style={{
          textAlign: "center",
          padding: "3.5rem 1rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow orbs */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(212,168,67,0.1)",
              border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: 999,
              padding: "0.3rem 1rem",
              marginBottom: "1rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--color-sphere-gold)",
            }}
          >
            <Trophy size={12} />
            Season 2025 Rankings
          </div>
        </motion.div>

        <motion.h1
          className="leaderboard-hero-title"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          style={{
            fontSize: "clamp(3rem, 10vw, 7rem)",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: 0,
            background: "linear-gradient(135deg, var(--color-sphere-coral) 0%, var(--color-sphere-gold) 60%, #fff8dc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: "0 0 0.4rem",
          }}
        >
          THE PLAY
          <br />
          LEAGUE
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ color: "var(--color-sphere-gold)", fontWeight: 600, fontSize: "1rem", margin: "0 0 2rem" }}
        >
          Season 2025 — Sahel, Egypt
        </motion.p>

        {/* Type toggle */}
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 999,
            padding: 4,
          }}
        >
          {(["season", "today"] as BoardType[]).map((t) => (
            <button
              key={t}
              onClick={() => setBoardType(t)}
              style={{
                padding: "0.45rem 1.25rem",
                borderRadius: 999,
                border: "none",
                background: boardType === t ? "var(--color-sphere-coral)" : "transparent",
                color: boardType === t ? "#fff" : "var(--color-text-muted)",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.04em",
              }}
            >
              {t === "season" ? "Season" : "Today"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 1rem" }}>
        {/* Error */}
        {error && !loading && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12,
              padding: "1rem",
              color: "#f87171",
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Top 3 hero cards */}
        {!loading && top3.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
              marginBottom: "1.75rem",
            }}
          >
            {/* Re-order: 2nd, 1st, 3rd for visual pyramid */}
            {[
              top3[1] ?? null,
              top3[0] ?? null,
              top3[2] ?? null,
            ].map((entry, i) => {
              if (!entry) return <div key={i} />;
              const isFirst = entry.rank === 1;
              return (
                <motion.div
                  key={entry.profile_id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: isFirst ? -12 : 0 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 260, damping: 22 }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 16,
                    padding: isFirst ? "1.5rem 0.75rem" : "1.25rem 0.75rem",
                    textAlign: "center",
                    border: RANK_BORDERS[entry.rank] ?? "1px solid rgba(255,255,255,0.08)",
                    boxShadow: RANK_SHADOWS[entry.rank] ?? "none",
                    position: "relative",
                  }}
                >
                  <div style={{ marginBottom: "0.5rem" }}>
                    <RankIcon rank={entry.rank} />
                  </div>

                  {/* Avatar */}
                  <div
                    style={{
                      width: isFirst ? 60 : 48,
                      height: isFirst ? 60 : 48,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${getRankColor(entry.rank)}, rgba(255,255,255,0.3))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: isFirst ? "1.2rem" : "1rem",
                      color: "#fff",
                      margin: "0 auto 0.5rem",
                      boxShadow: `0 0 14px ${getRankColor(entry.rank)}60`,
                    }}
                  >
                    {generateInitials(entry.name)}
                  </div>

                  <div
                    style={{
                      fontSize: isFirst ? "0.95rem" : "0.82rem",
                      fontWeight: 700,
                      color: "var(--color-surface)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {entry.name}
                  </div>
                  <div
                    style={{
                      fontSize: isFirst ? "1.05rem" : "0.9rem",
                      fontWeight: 800,
                      color: getRankColor(entry.rank),
                    }}
                  >
                    {formatPoints(entry.total_points)}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {entry.visit_count} visit{entry.visit_count !== 1 ? "s" : ""}
                    {entry.current_streak >= 3 && (
                      <span style={{ marginLeft: "0.3rem", color: "#fb923c" }}>
                        🔥{entry.current_streak}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Ranks 4–20 */}
        {!loading && rest.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {rest.map((entry, i) => (
              <motion.div
                key={entry.profile_id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 300, damping: 26 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  padding: "0.75rem 1rem",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "background 0.15s ease",
                }}
              >
                {/* Rank number */}
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    flexShrink: 0,
                  }}
                >
                  {entry.rank}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    color: "#fff",
                    flexShrink: 0,
                    opacity: 0.8,
                  }}
                >
                  {generateInitials(entry.name)}
                </div>

                {/* Name + visits */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--color-surface)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 1 }}>
                    {entry.visit_count} visit{entry.visit_count !== 1 ? "s" : ""}
                    {entry.current_streak >= 3 && (
                      <span style={{ marginLeft: "0.3rem", color: "#fb923c" }}>
                        <Flame size={10} style={{ display: "inline", verticalAlign: "middle" }} />
                        {entry.current_streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      color: "var(--color-sphere-coral)",
                    }}
                  >
                    {formatPoints(entry.total_points)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                    <PositionIndicator
                      current={entry.rank}
                      previous={entry.previous_rank}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "var(--color-text-muted)",
            }}
          >
            <Trophy size={48} style={{ marginBottom: "1rem", opacity: 0.3 }} />
            <p style={{ fontSize: "1rem" }}>No rankings yet — be the first on the board!</p>
          </div>
        )}

        {/* Auto-refresh note */}
        {!loading && entries.length > 0 && (
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.72rem",
              marginTop: "1.5rem",
            }}
          >
            Updates every 30 seconds
          </p>
        )}
      </div>

      <style>{`
        @media (max-width: 480px) {
          .leaderboard-hero-title {
            font-size: 2.55rem !important;
            line-height: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
