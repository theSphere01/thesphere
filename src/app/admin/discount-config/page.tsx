"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { DEFAULT_DISCOUNT_CONFIG } from "@/lib/constants";
import type { DiscountConfig } from "@/lib/types";

type FieldRow = { key: keyof DiscountConfig; label: string; description: string; category: string };

const FIELDS: FieldRow[] = [
  { key: "visit_2",        label: "2nd Visit",               description: "Discount on camper's 2nd visit",                  category: "Loyalty" },
  { key: "visit_3",        label: "3rd Visit",               description: "Discount on camper's 3rd visit",                  category: "Loyalty" },
  { key: "visit_4_plus",   label: "4th Visit+",              description: "Discount on 4th and subsequent visits",            category: "Loyalty" },
  { key: "group_5",        label: "Group of 5+",             description: "Discount when 5 or more register together",        category: "Group" },
  { key: "sibling",        label: "Sibling Same Day",         description: "Discount for siblings visiting on the same day",  category: "Group" },
  { key: "early_bird",     label: "Early Bird (48hr)",        description: "Discount for booking 48+ hours in advance",       category: "Special" },
  { key: "ceremony_1st",   label: "Ceremony 1st Place",       description: "Prize discount for daily ceremony winner",         category: "Ceremony" },
  { key: "ceremony_2nd",   label: "Ceremony 2nd Place",       description: "Prize discount for 2nd place",                    category: "Ceremony" },
  { key: "ceremony_3rd",   label: "Ceremony 3rd Place",       description: "Prize discount for 3rd place",                    category: "Ceremony" },
  { key: "ceremony_top10", label: "Ceremony Top 10 (VIP)",   description: "VIP discount for places 4–10",                    category: "Ceremony" },
  { key: "all_participants", label: "All Participants",       description: "Participation discount for everyone at ceremony",  category: "Ceremony" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Loyalty:   "#3498DB",
  Group:     "#2ECC71",
  Special:   "#F39C12",
  Ceremony:  "#D4A843",
};

const categories = [...new Set(FIELDS.map(f => f.category))];

export default function DiscountConfigPage() {
  const [config, setConfig] = useState<DiscountConfig>({ ...DEFAULT_DISCOUNT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function updateField(key: keyof DiscountConfig, value: string) {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 100) setConfig(prev => ({ ...prev, [key]: num }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/discount-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setMsg(res.ok ? "Discount config saved!" : "Save failed.");
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
        <h1 className="text-3xl font-black text-white mb-1">Discount Config</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Edit all discount percentages. Applied automatically at checkout.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const catColor = CATEGORY_COLORS[cat] ?? "#94a3b8";
          const catFields = FIELDS.filter(f => f.category === cat);
          return (
            <div key={cat}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: catColor }}>
                <span className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                {cat} Discounts
              </h2>
              <div className="space-y-3">
                {catFields.map((field, i) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{field.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{field.description}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-20 px-3 py-2 rounded-lg text-white text-sm text-right outline-none font-mono"
                        style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)" }}
                      />
                      <span className="text-sm font-bold" style={{ color: catColor }}>%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
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
          <Save size={16} /> {saving ? "Saving…" : "Save Discount Config"}
        </motion.button>
      </div>
    </div>
  );
}
