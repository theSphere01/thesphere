"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, PlusCircle, MinusCircle, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatPoints } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface CamperRow extends Profile {
  adjusting?: boolean;
  adjustDelta?: number;
}

export default function CampersPage() {
  const [query, setQuery] = useState("");
  const [campers, setCampers] = useState<CamperRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; delta: number } | null>(null);
  const [adjustMsg, setAdjustMsg] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState("");

  const fetchCampers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = `/api/profiles?search=${encodeURIComponent(q)}&limit=50`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCampers(data.data ?? []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchCampers(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchCampers]);

  async function applyAdjustment(profileId: string, delta: number) {
    if (delta === 0) { setAdjusting(null); return; }
    try {
      const res = await fetch(`/api/profiles/${profileId}/adjust-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        setCampers(prev => prev.map(c =>
          c.id === profileId
            ? { ...c, total_points: Math.max(0, c.total_points + delta), season_points: Math.max(0, c.season_points + delta) }
            : c
        ));
        setAdjustMsg(prev => ({ ...prev, [profileId]: `${delta > 0 ? "+" : ""}${delta} pts applied` }));
        setTimeout(() => setAdjustMsg(prev => { const next = { ...prev }; delete next[profileId]; return next; }), 2500);
      }
    } catch {
      // ignore
    } finally {
      setAdjusting(null);
    }
  }

  async function deleteCamper(camper: CamperRow) {
    const confirmed = window.confirm(
      `Delete ${camper.name}? This removes the camper profile, wristband, sessions, points log, badges, discounts, and leaderboard entry.`
    );
    if (!confirmed) return;

    setDeletingId(camper.id);
    setDeleteMsg("");
    try {
      const res = await fetch(`/api/profiles/${camper.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error ?? "Could not delete camper.");
      }

      setCampers(prev => prev.filter(c => c.id !== camper.id));
      setDeleteMsg(`${camper.name} deleted.`);
      setTimeout(() => setDeleteMsg(""), 2500);
    } catch (err) {
      setDeleteMsg(err instanceof Error ? err.message : "Could not delete camper.");
    } finally {
      setDeletingId(null);
    }
  }

  const formatDate = (str: string) => new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Campers</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Search, view, and manage registered campers.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }} />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
        />
      </div>

      {deleteMsg && (
        <p className="mb-4 text-sm font-semibold" style={{ color: deleteMsg.includes("deleted") ? "#22c55e" : "#ef4444" }}>
          {deleteMsg}
        </p>
      )}

      {/* Table */}
      <div className="campers-table rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Header */}
        <div className="camper-table-header grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
          <span>Camper</span>
          <span>Age</span>
          <span>Visits</span>
          <span>Total Pts</span>
          <span>Last Visit</span>
          <span>Actions</span>
        </div>

        {loading && (
          <div className="py-16 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            Loading campers…
          </div>
        )}

        {!loading && campers.length === 0 && (
          <div className="py-16 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
            {query ? "No campers match your search." : "No campers registered yet."}
          </div>
        )}

        <AnimatePresence>
          {campers.map((camper, i) => (
            <motion.div
              key={camper.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="camper-table-row grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-t hover:bg-white/[0.03] transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {/* Name */}
              <div>
                <Link href={`/profile/${camper.id}`}
                  className="font-semibold text-white hover:underline flex items-center gap-1">
                  {camper.name}
                  <ExternalLink size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
                </Link>
                {camper.parent_name && (
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Parent: {camper.parent_name}
                  </div>
                )}
                {camper.parent_phone && (
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Phone: {camper.parent_phone}
                  </div>
                )}
              </div>

              {/* Age */}
              <span className="text-sm text-white">{camper.age ?? "—"}</span>

              {/* Visits */}
              <span className="camper-metric text-sm font-bold" data-label="Visits" style={{ color: "var(--color-sphere-coral)" }}>
                {camper.visit_count}
              </span>

              {/* Points */}
              <span className="camper-metric text-sm font-bold" data-label="Total Pts" style={{ color: "var(--color-sphere-gold)" }}>
                {formatPoints(camper.total_points)}
              </span>

              {/* Last visit */}
              <span className="camper-metric text-sm" data-label="Last Visit" style={{ color: "rgba(255,255,255,0.5)" }}>
                {camper.created_at ? formatDate(camper.created_at) : "—"}
              </span>

              {/* Actions */}
              <div className="camper-actions flex items-center gap-2">
                {adjustMsg[camper.id] && (
                  <span className="text-xs font-bold" style={{ color: "#22c55e" }}>
                    {adjustMsg[camper.id]}
                  </span>
                )}

                {adjusting?.id === camper.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setAdjusting(a => a ? { ...a, delta: a.delta - 50 } : null)}
                      style={{ color: "#ef4444" }}>
                      <MinusCircle size={16} />
                    </button>
                    <span className="text-xs font-mono text-white w-12 text-center"
                      style={{ color: adjusting.delta >= 0 ? "#22c55e" : "#ef4444" }}>
                      {adjusting.delta > 0 ? "+" : ""}{adjusting.delta}
                    </span>
                    <button onClick={() => setAdjusting(a => a ? { ...a, delta: a.delta + 50 } : null)}
                      style={{ color: "#22c55e" }}>
                      <PlusCircle size={16} />
                    </button>
                    <button onClick={() => applyAdjustment(camper.id, adjusting.delta)}
                      className="ml-1 px-2 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ background: "var(--color-ws-blue)" }}>
                      Apply
                    </button>
                    <button onClick={() => setAdjusting(null)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdjusting({ id: camper.id, delta: 0 })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)" }}
                  >
                    Adjust Pts
                  </button>
                )}

                <Link href={`/profile/${camper.id}`}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}>
                  <ChevronRight size={16} />
                </Link>
                <button
                  onClick={() => deleteCamper(camper)}
                  disabled={deletingId === camper.id}
                  title="Delete camper"
                  className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors disabled:opacity-50"
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .campers-table {
            border: 0 !important;
            background: transparent !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0.75rem !important;
          }

          .camper-table-header {
            display: none !important;
          }

          .camper-table-row {
            grid-template-columns: 1fr !important;
            gap: 0.8rem !important;
            padding: 1rem !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: 14px !important;
            background: rgba(255,255,255,0.04) !important;
          }

          .camper-table-row > span {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 1rem !important;
            padding: 0.55rem 0 !important;
            border-top: 1px solid rgba(255,255,255,0.06) !important;
          }

          .camper-table-row > span::before {
            color: rgba(255,255,255,0.42);
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .camper-table-row > span:nth-of-type(1)::before {
            content: "Age";
          }

          .camper-table-row > span:nth-of-type(2)::before {
            content: "Visits";
          }

          .camper-table-row > span:nth-of-type(3)::before {
            content: "Total Pts";
          }

          .camper-table-row > span:nth-of-type(4)::before {
            content: "Last Visit";
          }

          .camper-actions {
            flex-wrap: wrap !important;
            justify-content: flex-start !important;
            padding-top: 0.35rem !important;
          }

          .camper-actions > button,
          .camper-actions > a {
            min-height: 36px !important;
          }
        }
      `}</style>
    </div>
  );
}
