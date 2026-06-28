"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Link as LinkIcon, Check, Loader2, ImageIcon, RefreshCw, Trash2 } from "lucide-react";

interface PhotoSlot {
  key: string;
  label: string;
  description: string;
}

const SLOTS: PhotoSlot[] = [
  {
    key: "home_hero_photo",
    label: "Hero Background",
    description: "Full-screen photo behind the 3D arch on the home page",
  },
  {
    key: "home_transition_photo",
    label: "Enter Transition",
    description: "Photo that bursts in when a visitor clicks \"Enter The Sphere\"",
  },
];

function PhotoCard({ slot, currentUrl, onSaved }: {
  slot: PhotoSlot;
  currentUrl: string;
  onSaved: (key: string, url: string) => void;
}) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "home");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await saveSetting(json.data.url);
      setPreview(json.data.url);
    } catch (e) {
      alert("Upload failed: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function saveSetting(url: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: slot.key, value: url }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onSaved(slot.key, url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert("Save failed: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const displayUrl = preview ?? currentUrl;

  async function removePhoto() {
    if (!displayUrl) return;
    if (!window.confirm(`Remove ${slot.label}? The public page will fall back to no custom photo for this slot.`)) return;
    await saveSetting("");
    setPreview("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) uploadFile(file);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#1e293b",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Current photo preview */}
      <div style={{ position: "relative", height: 200, background: "#0f172a" }}>
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={slot.label}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.3)" }}>
            <ImageIcon size={48} />
          </div>
        )}
        {displayUrl && (
          <button
            type="button"
            onClick={removePhoto}
            title="Remove photo"
            aria-label={`Remove ${slot.label}`}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              background: "rgba(185,28,28,0.92)",
              color: "#fff",
              padding: "0.42rem 0.75rem",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
            }}
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(82,214,138,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{
              background: "#52D68A", color: "#0f172a",
              borderRadius: 9999, padding: "0.5rem 1.25rem",
              fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            }}>
              <Check size={16} /> Saved!
            </div>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "1.25rem 1.5rem 0.75rem" }}>
        <h3 style={{ color: "white", fontWeight: 700, fontSize: "1rem", margin: 0 }}>{slot.label}</h3>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", margin: "0.25rem 0 0" }}>{slot.description}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "0 1.5rem 0.75rem" }}>
        {(["upload", "url"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: tab === t ? "var(--color-sphere-coral)" : "rgba(255,255,255,0.08)",
              color: tab === t ? "white" : "rgba(255,255,255,0.6)",
              transition: "all 0.2s",
            }}
          >
            {t === "upload" ? "Upload File" : "Paste URL"}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <div style={{ padding: "0 1.5rem 1.5rem" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "var(--color-sphere-coral)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: 12,
              padding: "1.5rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(255,107,71,0.08)" : "rgba(255,255,255,0.03)",
              transition: "all 0.2s",
            }}
          >
            {uploading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "rgba(255,255,255,0.6)" }}>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Uploading...
              </div>
            ) : (
              <>
                <Upload size={22} style={{ color: "rgba(255,255,255,0.4)", marginBottom: 6 }} />
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", margin: 0 }}>
                  Click or drag an image here
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* URL tab */}
      {tab === "url" && (
        <div style={{ padding: "0 1.5rem 1.5rem", display: "flex", gap: 8 }}>
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "0.6rem 0.85rem",
              color: "white",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
          <button
            onClick={() => { if (urlInput.trim()) { setPreview(urlInput.trim()); saveSetting(urlInput.trim()); } }}
            disabled={saving || !urlInput.trim()}
            style={{
              padding: "0.6rem 1rem",
              background: "var(--color-sphere-coral)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              opacity: saving || !urlInput.trim() ? 0.5 : 1,
            }}
          >
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <LinkIcon size={16} />}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

export default function HomePhotosPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/settings");
    const json = await res.json();
    setSettings(json.data ?? {});
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleSaved(key: string, url: string) {
    setSettings(prev => ({ ...prev, [key]: url }));
  }

  return (
    <div style={{ padding: "2.5rem 2rem", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: "2rem", margin: 0 }}>Home Page Photos</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
            Change the background and transition photos on the public home page
          </p>
        </div>
        <button
          onClick={load}
          style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "0.5rem", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "1.5rem" }}>
          {SLOTS.map(slot => (
            <PhotoCard
              key={slot.key}
              slot={slot}
              currentUrl={settings[slot.key] ?? ""}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}

      <div style={{
        marginTop: "2.5rem",
        background: "rgba(245,196,0,0.08)",
        border: "1px solid rgba(245,196,0,0.25)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        color: "rgba(255,255,255,0.6)",
        fontSize: "0.85rem",
        lineHeight: 1.6,
      }}>
        <strong style={{ color: "#F5C400" }}>Note:</strong> Changes go live immediately on the public site. For the transition photo, use a bright, energetic image — it fills the screen when visitors click "Enter The Sphere".
        <br />
        If the <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 4 }}>site_settings</code> table doesn't exist yet, run this SQL in Supabase:
        <pre style={{
          background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "0.75rem 1rem",
          marginTop: "0.75rem", fontSize: "0.78rem", overflowX: "auto",
          color: "#52D68A",
        }}>
{`CREATE TABLE site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "admin write" ON site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid()));`}
        </pre>
      </div>
    </div>
  );
}
