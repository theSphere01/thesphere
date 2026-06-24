"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Trophy, Play, CheckCircle, Crown } from "lucide-react";
import { CEREMONY_PRIZES } from "@/lib/constants";
import { getRankSuffix } from "@/lib/utils";
import type { LeaderboardEntry, CeremonyWinner } from "@/lib/types";

interface PreviewEntry extends LeaderboardEntry {
  prize?: string;
  discount?: number;
}

export default function CeremoniesPage() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(todayStr);
  const [leaderboard, setLeaderboard] = useState<PreviewEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<{ name: string; code: string; discount: number }[]>([]);

  async function runCeremony() {
    setLoading(true);
    setMsg("");
    setLeaderboard([]);
    setDone(false);
    setGeneratedCodes([]);
    try {
      const res = await fetch(`/api/leaderboard?date=${date}&limit=10`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      const entries: PreviewEntry[] = (data.data ?? []).map((e: LeaderboardEntry, idx: number) => {
        const rank = idx + 1;
        const prize = CEREMONY_PRIZES.find(p => {
          if (p.rank === rank) return true;
          if ("max" in p && p.rank <= rank && rank <= (p.max ?? rank)) return true;
          return false;
        });
        return { ...e, rank, prize: prize?.prize, discount: prize?.discount };
      });
      setLeaderboard(entries);
    } catch {
      setMsg("Could not load leaderboard. Check /api/leaderboard route.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmAndAward() {
    setConfirming(true);
    setMsg("");
    try {
      const res = await fetch("/api/ceremonies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ceremony_date: date, winners: leaderboard }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setGeneratedCodes(data.codes ?? []);
        setMsg("Ceremony complete! Discount codes generated.");
      } else {
        setMsg(data.error ?? "Ceremony failed.");
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setConfirming(false);
    }
  }

  const getRankMeta = (rank: number) => {
    if (rank === 1) return { color: "var(--color-rank-gold)", icon: <Crown size={16} /> };
    if (rank === 2) return { color: "var(--color-rank-silver)", icon: "🥈" };
    if (rank === 3) return { color: "var(--color-rank-bronze)", icon: "🥉" };
    return { color: "rgba(255,255,255,0.5)", icon: null };
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Daily Ceremony</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Run the ceremony to award today's top campers.
        </p>
      </div>

      {/* Date + run */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-semibold text-white">Ceremony Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setLeaderboard([]); setDone(false); }}
          className="px-4 py-2.5 rounded-xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
        />
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={runCeremony}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "var(--color-sphere-coral)" }}
        >
          <Play size={15} /> {loading ? "Loading…" : "Run Ceremony"}
        </motion.button>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: msg.includes("!") || msg.includes("complete") ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                   color: msg.includes("!") || msg.includes("complete") ? "#22c55e" : "#ef4444" }}
        >
          {msg}
        </motion.div>
      )}

      {/* Leaderboard preview */}
      <AnimatePresence>
        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-xl font-black text-white mb-4">Top 10 for {date}</h2>
            <div className="space-y-2 mb-6">
              {leaderboard.map((entry, i) => {
                const { color, icon } = getRankMeta(entry.rank);
                return (
                  <motion.div
                    key={entry.profile_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center font-black text-lg" style={{ color }}>
                      {icon ?? `${entry.rank}${getRankSuffix(entry.rank)}`}
                    </div>

                    {/* Name + prize */}
                    <div className="flex-1">
                      <div className="font-bold text-white">{entry.name}</div>
                      {entry.prize && (
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {entry.prize}
                        </div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="font-black" style={{ color: "var(--color-sphere-gold)" }}>
                        {entry.total_points.toLocaleString()} pts
                      </div>
                      {entry.discount && (
                        <div className="text-xs font-bold" style={{ color: "#22c55e" }}>
                          {entry.discount}% off next visit
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {!done && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={confirmAndAward}
                disabled={confirming}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-black text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--color-sphere-gold) 0%, #b8922e 100%)" }}
              >
                <Trophy size={20} />
                {confirming ? "Awarding…" : "Confirm & Award Prizes"}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated codes */}
      <AnimatePresence>
        {done && generatedCodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} style={{ color: "#22c55e" }} />
              <h2 className="text-xl font-black text-white">Discount Codes Generated</h2>
            </div>
            <div className="space-y-2">
              {generatedCodes.map((entry, i) => (
                <div key={i}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <div>
                    <span className="font-bold text-white">{entry.name}</span>
                    <span className="ml-3 text-sm font-black font-mono"
                      style={{ color: "var(--color-sphere-gold)" }}>
                      {entry.code}
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#22c55e" }}>
                    {entry.discount}% off
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
