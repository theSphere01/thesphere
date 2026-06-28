"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Save, Copy } from "lucide-react";
import { LANDS } from "@/lib/constants";
import { hexToRgba } from "@/lib/utils";

type LandSchedule = {
  id: string;
  name: string;
  slug: string;
  theme_color: string;
  icon_emoji: string;
  is_open: boolean;
  expanded: boolean;
  stations: { id: string; name: string; emoji: string; is_active: boolean }[];
};

function buildDefaultSchedule(): LandSchedule[] {
  return LANDS.map(l => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    theme_color: l.theme_color,
    icon_emoji: l.icon_emoji,
    is_open: true,
    expanded: false,
    stations: l.stations.map(s => ({ id: s.id, name: s.name, emoji: s.emoji, is_active: true })),
  }));
}

export default function SchedulePage() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(todayStr);
  const [schedule, setSchedule] = useState<LandSchedule[]>(buildDefaultSchedule());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function toggleLand(landId: string) {
    setSchedule(prev => prev.map(l => l.id === landId ? { ...l, is_open: !l.is_open } : l));
  }

  function toggleStation(landId: string, stationId: string) {
    setSchedule(prev => prev.map(l =>
      l.id === landId
        ? { ...l, stations: l.stations.map(s => s.id === stationId ? { ...s, is_active: !s.is_active } : s) }
        : l
    ));
  }

  function toggleExpand(landId: string) {
    setSchedule(prev => prev.map(l => l.id === landId ? { ...l, expanded: !l.expanded } : l));
  }

  async function saveSchedule() {
    setSaving(true);
    setMsg("");
    const openLandIds = schedule.filter(l => l.is_open).map(l => l.id);
    const activeStationIds = schedule.flatMap(l => l.stations.filter(s => s.is_active).map(s => s.id));
    try {
      const res = await fetch("/api/schedule/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_date: date, open_land_ids: openLandIds, active_station_ids: activeStationIds }),
      });
      setMsg(res.ok ? "Schedule saved!" : "Save failed.");
    } catch {
      setMsg("Network error.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  async function copyYesterday() {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = format(yesterday, "yyyy-MM-dd");
    try {
      const res = await fetch(`/api/schedule/save?date=${yStr}`);
      if (res.ok) {
        const data = await res.json();
        // Apply loaded schedule
        if (data.open_land_ids && data.active_station_ids) {
          setSchedule(prev => prev.map(l => ({
            ...l,
            is_open: data.open_land_ids.includes(l.id),
            stations: l.stations.map(s => ({ ...s, is_active: data.active_station_ids.includes(s.id) })),
          })));
          setMsg("Yesterday's schedule loaded!");
        }
      }
    } catch {
      setMsg("Could not load yesterday's schedule.");
    }
    setTimeout(() => setMsg(""), 3000);
  }

  const openCount = schedule.filter(l => l.is_open).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="schedule-header flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Daily Schedule</h1>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Set which lands and stations are open each day.
          </p>
        </div>
        <div className="schedule-actions flex items-center gap-3">
          <button
            onClick={copyYesterday}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Copy size={15} /> Copy Yesterday
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={saveSchedule}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "var(--color-ws-blue)" }}
          >
            <Save size={15} /> {saving ? "Saving…" : "Save Schedule"}
          </motion.button>
        </div>
      </div>

      {/* Date picker */}
      <div className="schedule-date-row flex items-center gap-4 mb-6">
        <label className="text-sm font-semibold text-white">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
        />
        <span className="text-sm px-3 py-1.5 rounded-full"
          style={{ background: "rgba(26,188,156,0.15)", color: "#1ABC9C" }}>
          {openCount} / 11 lands open
        </span>
      </div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: msg.includes("!") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                   color: msg.includes("!") ? "#22c55e" : "#ef4444",
                   border: `1px solid ${msg.includes("!") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}
        >
          {msg}
        </motion.div>
      )}

      {/* Land list */}
      <div className="space-y-3">
        {schedule.map((land, i) => (
          <motion.div
            key={land.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${land.is_open ? hexToRgba(land.theme_color, 0.35) : "rgba(255,255,255,0.07)"}`,
            }}
          >
            {/* Land row */}
            <div className="schedule-land-row flex items-center gap-4 px-5 py-4">
              {/* Color dot */}
              <div className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: land.is_open ? land.theme_color : "rgba(255,255,255,0.2)" }} />

              <span className="text-xl">{land.icon_emoji}</span>

              <div className="schedule-land-name flex-1 font-bold text-white">{land.name}</div>

              {/* Station count */}
              <span className="schedule-station-count text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {land.stations.filter(s => s.is_active).length}/{land.stations.length} stations active
              </span>

              {/* Open toggle */}
              <button
                onClick={() => toggleLand(land.id)}
                className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                style={{ background: land.is_open ? land.theme_color : "rgba(255,255,255,0.15)" }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: land.is_open ? "26px" : "4px" }}
                />
              </button>

              {/* Expand stations */}
              <button
                onClick={() => toggleExpand(land.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {land.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Stations sub-section */}
            {land.expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t px-5 py-4 space-y-2"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                {land.stations.map((station) => (
                  <div key={station.id} className="flex items-center gap-3">
                    <span className="text-base w-6">{station.emoji}</span>
                    <span className="flex-1 text-sm text-white">{station.name}</span>
                    <button
                      onClick={() => toggleStation(land.id, station.id)}
                      className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
                      style={{ background: station.is_active ? hexToRgba(land.theme_color, 0.8) : "rgba(255,255,255,0.12)" }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: station.is_active ? "17px" : "2px" }}
                      />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <style>{`
        @media (max-width: 760px) {
          .schedule-header,
          .schedule-actions,
          .schedule-date-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .schedule-actions,
          .schedule-date-row {
            gap: 0.65rem !important;
          }

          .schedule-actions button,
          .schedule-date-row input,
          .schedule-date-row span {
            width: 100% !important;
            justify-content: center !important;
          }

          .schedule-land-row {
            flex-wrap: wrap !important;
            gap: 0.75rem !important;
            padding: 0.9rem !important;
          }

          .schedule-land-name {
            flex-basis: calc(100% - 4rem) !important;
            min-width: 0 !important;
          }

          .schedule-station-count {
            order: 5 !important;
            width: 100% !important;
            padding-left: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
