"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Link as LinkIcon, Check, Loader2, ImageIcon, RefreshCw, Trash2, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import {
  parseHomeGalleryPhotos,
  serializeHomeGalleryPhotos,
  type HomeGalleryPhoto,
} from "@/lib/home-gallery";

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

function GalleryManager({ currentValue, onSaved }: {
  currentValue: string;
  onSaved: (key: string, value: string) => void;
}) {
  const [photos, setPhotos] = useState<HomeGalleryPhoto[]>(() => parseHomeGalleryPhotos(currentValue));
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(parseHomeGalleryPhotos(currentValue));
  }, [currentValue]);

  async function savePhotos(next: HomeGalleryPhoto[]) {
    setPhotos(next);
    setSaving(true);
    try {
      const value = serializeHomeGalleryPhotos(next);
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "home_gallery_photos", value }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onSaved("home_gallery_photos", value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      alert("Save failed: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function makePhoto(src: string, alt: string): HomeGalleryPhoto {
    return {
      id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      src,
      alt: alt.trim() || `The Sphere photo ${photos.length + 1}`,
    };
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "home-gallery");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await savePhotos([...photos, makePhoto(json.data.url, altInput || file.name.replace(/\.[^.]+$/, ""))]);
      setAltInput("");
    } catch (e) {
      alert("Upload failed: " + (e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addUrlPhoto() {
    const src = urlInput.trim();
    if (!src) return;
    savePhotos([...photos, makePhoto(src, altInput)]);
    setUrlInput("");
    setAltInput("");
  }

  function removePhoto(photoId: string) {
    if (!window.confirm("Remove this photo from the public home strip?")) return;
    savePhotos(photos.filter((photo) => photo.id !== photoId));
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    savePhotos(next);
  }

  function updateAlt(photoId: string, alt: string) {
    setPhotos(prev => prev.map(photo => photo.id === photoId ? { ...photo, alt } : photo));
  }

  function saveAlt(photoId: string, alt: string) {
    savePhotos(photos.map(photo => photo.id === photoId ? { ...photo, alt: alt.trim() || "The Sphere photo" } : photo));
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: "1.75rem",
        background: "#1e293b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1.4rem 1.5rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ color: "white", fontWeight: 900, fontSize: "1.1rem", margin: 0 }}>See It Yourself Strip</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", margin: "0.25rem 0 0" }}>
              Control the horizontal photos on the public home page.
            </p>
          </div>
          <div style={{ color: saved ? "#52D68A" : "rgba(255,255,255,0.38)", fontSize: "0.78rem", fontWeight: 800 }}>
            {saving ? "Saving..." : saved ? "Saved" : `${photos.length} photos`}
          </div>
        </div>
      </div>

      <div style={{ padding: "1.25rem 1.5rem", display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "0.75rem" }}>
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="Paste image URL"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "0.7rem 0.85rem",
              color: "white",
              fontSize: "0.86rem",
              outline: "none",
            }}
          />
          <input
            value={altInput}
            onChange={e => setAltInput(e.target.value)}
            placeholder="Caption / alt text"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "0.7rem 0.85rem",
              color: "white",
              fontSize: "0.86rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "none", borderRadius: 10, padding: "0.75rem 1rem",
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.82)",
              fontSize: "0.86rem", fontWeight: 800, cursor: "pointer",
              opacity: uploading || saving ? 0.55 : 1,
            }}
          >
            {uploading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
            Upload
          </button>
          <button
            type="button"
            onClick={addUrlPhoto}
            disabled={!urlInput.trim() || saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "none", borderRadius: 10, padding: "0.75rem 1rem",
              background: "var(--color-sphere-coral)", color: "#fff",
              fontSize: "0.86rem", fontWeight: 900, cursor: "pointer",
              opacity: !urlInput.trim() || saving ? 0.55 : 1,
            }}
          >
            <Plus size={16} />
            Add URL
          </button>
        </div>

        {photos.length === 0 ? (
          <div style={{
            border: "1px dashed rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 14,
            padding: "2rem",
            textAlign: "center",
            color: "rgba(255,255,255,0.35)",
          }}>
            No strip photos. Add an upload or URL above.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap: "0.9rem" }}>
            {photos.map((photo, index) => (
              <div key={photo.id} style={{
                background: "rgba(15,23,42,0.72)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                overflow: "hidden",
              }}>
                <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#0f172a" }}>
                  <img src={photo.src} alt={photo.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    title="Remove photo"
                    aria-label="Remove strip photo"
                    style={{
                      position: "absolute", top: 8, right: 8,
                      width: 34, height: 34, borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(185,28,28,0.92)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "0 8px 22px rgba(0,0,0,0.38)",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div style={{ padding: "0.7rem" }}>
                  <input
                    value={photo.alt}
                    onChange={e => updateAlt(photo.id, e.target.value)}
                    onBlur={e => saveAlt(photo.id, e.target.value)}
                    placeholder="Caption"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "white",
                      padding: "0.5rem 0.55rem",
                      fontSize: "0.78rem",
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: "0.55rem" }}>
                    <button
                      type="button"
                      onClick={() => movePhoto(index, -1)}
                      disabled={index === 0 || saving}
                      aria-label="Move photo left"
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        border: "none", borderRadius: 8, padding: "0.45rem",
                        background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.72)",
                        cursor: "pointer", opacity: index === 0 || saving ? 0.35 : 1,
                      }}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(index, 1)}
                      disabled={index === photos.length - 1 || saving}
                      aria-label="Move photo right"
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        border: "none", borderRadius: 8, padding: "0.45rem",
                        background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.72)",
                        cursor: "pointer", opacity: index === photos.length - 1 || saving ? 0.35 : 1,
                      }}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.section>
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
            Change the hero, transition, and scrolling strip photos on the public home page
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
        <>
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
          <GalleryManager
            currentValue={settings.home_gallery_photos ?? ""}
            onSaved={handleSaved}
          />
        </>
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
        <strong style={{ color: "#F5C400" }}>Note:</strong> Changes go live immediately on the public site. For the transition photo, use a bright, energetic image because it fills the screen when visitors click "Enter The Sphere".
      </div>
    </div>
  );
}
