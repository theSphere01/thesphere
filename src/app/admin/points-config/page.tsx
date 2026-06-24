"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Info } from "lucide-react";
import { DEFAULT_POINTS_CONFIG } from "@/lib/constants";
import type { PointsConfig } from "@/lib/types";

type FieldConfig = {
  key: keyof PointsConfig;
  label: string;
  description: string;
  suffix: string;
  step: number;
};

const FIELDS: FieldConfig[] = [
  { key: "per_hour",           label: "Per Hour",                  description: "Points earned per hour spent in any land",                     suffix: "pts",  step: 5 },
  { key: "bonus_2h",           label: "2-Hour Session Bonus",       description: "Extra points for completing 2+ hours in a session",            suffix: "pts",  step: 5 },
  { key: "bonus_3h",           label: "3-Hour Session Bonus",       description: "Extra points for completing 3+ hours in a session",            suffix: "pts",  step: 5 },
  { key: "bonus_5h",           label: "5-Hour Session Bonus",       description: "Extra points for completing 5+ hours in a session",            suffix: "pts",  step: 10 },
  { key: "return_visit",       label: "Return Visit Bonus",         description: "Points for visiting on a different day than last time",        suffix: "pts",  step: 10 },
  { key: "new_land",           label: "New Land Bonus",             description: "Points for first-ever visit to a specific land",               suffix: "pts",  step: 10 },
  { key: "explorer",           label: "Explorer Bonus",             description: "One-time bonus for visiting 5+ different lands in a season",   suffix: "pts",  step: 25 },
  { key: "streak_3_multiplier",label: "3-Day Streak Multiplier",    description: "Multiplier applied when visiting 3 consecutive days",          suffix: "x",    step: 0.1 },
  { key: "streak_5_multiplier",label: "5-Visit Streak Multiplier",  description: "Multiplier applied when visiting 5 consecutive days",          suffix: "x",    step: 0.1 },
];

export default function PointsConfigPage() {
  const [config, setConfig] = useState<PointsConfig>({ ...DEFAULT_POINTS_CONFIG });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function updateField(key: keyof PointsConfig, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) setConfig(prev => ({ ...prev, [key]: num }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/points-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setMsg(res.ok ? "Points config saved!" : "Save failed.");
    } catch {
      setMsg("Network error.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Points Config</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Adjust the points rules. Changes take effect on the next session checkout.
        </p>
      </div>

      <div className="space-y-4">
        {FIELDS.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-bold text-white text-sm mb-0.5">{field.label}</div>
                <div className="flex items-start gap-1.5">
                  <Info size={11} className="mt-0.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{field.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="number"
                  value={config[field.key]}
                  step={field.step}
                  min={0}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl text-white text-sm text-right outline-none font-mono"
                  style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)" }}
                />
                <span className="text-sm font-semibold w-6" style={{ color: "var(--color-sphere-gold)" }}>
                  {field.suffix}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {msg && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm font-semibold text-center"
          style={{ color: msg.includes("!") ? "#22c55e" : "#ef4444" }}
        >
          {msg}
        </motion.p>
      )}

      <div className="mt-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "var(--color-ws-blue)" }}
        >
          <Save size={16} /> {saving ? "Saving…" : "Save Points Config"}
        </motion.button>
      </div>
    </div>
  );
}
