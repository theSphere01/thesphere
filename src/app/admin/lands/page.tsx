"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { Edit3, X, Camera, Upload, Link2, Trash2, Plus, ImageOff } from "lucide-react";
import { LANDS } from "@/lib/constants";
import { hexToRgba } from "@/lib/utils";
import { getEgyptDateString } from "@/lib/dates";

type LandEntry = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  theme_color: string;
  icon_emoji: string;
  age_min: number;
  age_max: number;
  is_active: boolean;
  is_open_today: boolean;
  stations: readonly { id: string; name: string; emoji: string; is_active: boolean; [k: string]: unknown }[];
};

type Photo = { id: string; url: string; caption?: string; sort_order: number };
type ScheduleResponse = { lands?: { land_id: string; is_open: boolean }[] };

export default function AdminLandsPage() {
  const [lands, setLands] = useState<LandEntry[]>(LANDS.map(l => ({ ...l, is_open_today: true })));
  const [editingLand, setEditingLand] = useState<LandEntry | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", tagline: "", theme_color: "" });
  const [photoModalLand, setPhotoModalLand] = useState<LandEntry | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadTodaySchedule() {
      try {
        const res = await fetch(`/api/schedule?date=${getEgyptDateString()}`);
        const json = await res.json() as ScheduleResponse;
        if (!res.ok || !json.lands) return;
        const statusByLand = new Map(json.lands.map((item) => [item.land_id, item.is_open]));
        setLands(prev => prev.map(land => ({
          ...land,
          is_open_today: statusByLand.get(land.id) ?? true,
        })));
      } catch {
        // Keep the optimistic default if the schedule cannot be loaded.
      }
    }
    loadTodaySchedule();
  }, []);

  function openEdit(land: LandEntry) {
    setEditingLand(land);
    setEditForm({ name: land.name, description: land.description, tagline: land.tagline, theme_color: land.theme_color });
  }

  async function saveEdit() {
    if (!editingLand) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/lands/${editingLand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setLands(prev => prev.map(l => l.id === editingLand.id ? { ...l, ...editForm } : l));
        setMsg("Saved!");
        setTimeout(() => { setMsg(""); setEditingLand(null); }, 1200);
      } else {
        setMsg("Save failed.");
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleOpenToday(landId: string, current: boolean) {
    const next = !current;
    setLands(prev => prev.map(l => l.id === landId ? { ...l, is_open_today: next } : l));
    try {
      const res = await fetch(`/api/lands/${landId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open_today: next }),
      });
      if (!res.ok) throw new Error("Save failed");
      flash(next ? "Land opened for today." : "Land closed for today.");
    } catch {
      setLands(prev => prev.map(l => l.id === landId ? { ...l, is_open_today: current } : l));
      flash("Could not update land status.");
    }
  }

  async function loadPhotos(landId: string) {
    setPhotosLoading(true);
    setPhotos([]);
    try {
      const res = await fetch(`/api/lands/${landId}/photos`);
      const json = await res.json() as { data?: Photo[] };
      setPhotos(json.data ?? []);
    } catch {
      // silent
    } finally {
      setPhotosLoading(false);
    }
  }

  function openPhotoModal(land: LandEntry) {
    setPhotoModalLand(land);
    setPhotoUrl("");
    setPhotoCaption("");
    setMsg("");
    loadPhotos(land.id);
  }

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2200);
  }

  async function addPhotoByUrl() {
    if (!photoModalLand || !photoUrl.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/lands/${photoModalLand.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: photoUrl.trim(), caption: photoCaption.trim() || undefined }),
      });
      const json = await res.json() as { data?: Photo; error?: string };
      if (res.ok && json.data) {
        setPhotos(prev => [...prev, json.data!]);
        setPhotoUrl("");
        setPhotoCaption("");
        flash("Photo added!");
      } else {
        flash(json.error ?? "Failed");
      }
    } catch {
      flash("Network error.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadFile(file: File) {
    if (!photoModalLand) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (photoCaption.trim()) formData.append("caption", photoCaption.trim());
      const res = await fetch(`/api/lands/${photoModalLand.id}/photos`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json() as { data?: Photo; error?: string };
      if (res.ok && json.data) {
        setPhotos(prev => [...prev, json.data!]);
        setPhotoCaption("");
        flash("Photo uploaded!");
      } else {
        flash(json.error ?? "Upload failed");
      }
    } catch {
      flash("Network error.");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photoId: string) {
    if (!photoModalLand) return;
    if (!window.confirm("Remove this photo from the land?")) return;
    try {
      const res = await fetch(`/api/lands/${photoModalLand.id}/photos?photo_id=${photoId}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        flash("Photo removed.");
      } else {
        flash("Delete failed.");
      }
    } catch {
      flash("Delete failed.");
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Activity Lands</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Manage all 11 lands — toggle, edit, and manage photos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {lands.map((land, i) => (
          <motion.div key={land.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${hexToRgba(land.theme_color, 0.3)}` }}>
            <div className="h-2" style={{ background: land.theme_color }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{land.icon_emoji}</span>
                  <div>
                    <div className="font-bold text-white text-base">{land.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{land.stations.length} stations</div>
                  </div>
                </div>
                <button onClick={() => toggleOpenToday(land.id, land.is_open_today ?? true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={land.is_open_today
                    ? { background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e44" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: land.is_open_today ? "#22c55e" : "rgba(255,255,255,0.3)" }} />
                  {land.is_open_today ? "Open Today" : "Closed"}
                </button>
              </div>
              <p className="text-sm mb-4 line-clamp-2" style={{ color: "rgba(255,255,255,0.5)" }}>{land.description}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(land)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold hover:opacity-90"
                  style={{ background: hexToRgba(land.theme_color, 0.18), color: land.theme_color }}>
                  <Edit3 size={13} /> Edit Land
                </button>
                <button onClick={() => openPhotoModal(land)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>
                  <Camera size={13} /> Photos
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit modal */}
      <Dialog.Root open={!!editingLand} onOpenChange={(open) => { if (!open) setEditingLand(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-black text-white">Edit {editingLand?.name}</Dialog.Title>
                <button onClick={() => setEditingLand(null)} style={{ color: "rgba(255,255,255,0.5)" }}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                {(["name", "tagline"] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-semibold mb-1.5 capitalize" style={{ color: "rgba(255,255,255,0.6)" }}>{field}</label>
                    <input value={editForm[field]} onChange={(e) => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Description</label>
                  <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={editForm.theme_color} onChange={(e) => setEditForm(p => ({ ...p, theme_color: e.target.value }))}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0" style={{ background: "none" }} />
                    <input value={editForm.theme_color} onChange={(e) => setEditForm(p => ({ ...p, theme_color: e.target.value }))}
                      className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none font-mono"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }} />
                  </div>
                </div>
              </div>
              {msg && <p className="mt-3 text-sm text-center" style={{ color: msg.includes("!") ? "#22c55e" : "#ef4444" }}>{msg}</p>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingLand(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>Cancel</button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: "var(--color-ws-blue)" }}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Photo management modal */}
      <Dialog.Root open={!!photoModalLand} onOpenChange={(open) => { if (!open) setPhotoModalLand(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }} />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl rounded-2xl flex flex-col"
              style={{
                background: "#1e293b",
                border: `1px solid ${photoModalLand ? hexToRgba(photoModalLand.theme_color, 0.4) : "rgba(255,255,255,0.1)"}`,
                maxHeight: "90vh",
              }}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
                <Dialog.Title className="text-xl font-black text-white flex items-center gap-2">
                  <span>{photoModalLand?.icon_emoji}</span>
                  <span>{photoModalLand?.name} Photos</span>
                </Dialog.Title>
                <button onClick={() => setPhotoModalLand(null)} style={{ color: "rgba(255,255,255,0.5)" }}><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Tabs.Root defaultValue="upload">
                  <Tabs.List className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {[
                      { value: "upload", label: "Upload File" },
                      { value: "url", label: "Paste URL" },
                    ].map(tab => (
                      <Tabs.Trigger key={tab.value} value={tab.value}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white"
                        style={{ color: "rgba(255,255,255,0.5)" }}>
                        {tab.label}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  <Tabs.Content value="upload">
                    <div
                      className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 cursor-pointer transition-all"
                      style={{
                        borderColor: dragOver ? (photoModalLand?.theme_color ?? "#FF6B47") : "rgba(255,255,255,0.15)",
                        background: dragOver ? "rgba(255,107,71,0.05)" : "rgba(255,255,255,0.02)",
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileRef.current?.click()}
                    >
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <Upload size={40} style={{ color: uploading ? "#FF6B47" : "rgba(255,255,255,0.25)", marginBottom: "0.75rem" }} />
                      <p className="text-sm font-semibold" style={{ color: uploading ? "#FF6B47" : "white" }}>
                        {uploading ? "Uploading..." : "Drag and drop or click to choose a photo"}
                      </p>
                      <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>JPG, PNG, WEBP — max 10 MB</p>
                    </div>
                    <input value={photoCaption} onChange={e => setPhotoCaption(e.target.value)}
                      placeholder="Optional caption..."
                      className="mt-3 w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </Tabs.Content>

                  <Tabs.Content value="url">
                    <div className="space-y-3">
                      <input type="url" placeholder="https://example.com/photo.jpg" value={photoUrl}
                        onChange={e => setPhotoUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <input value={photoCaption} onChange={e => setPhotoCaption(e.target.value)}
                        placeholder="Optional caption..."
                        className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <button onClick={addPhotoByUrl} disabled={uploading || !photoUrl.trim()}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: "var(--color-ws-blue)" }}>
                        <Plus size={14} /> Add Photo
                      </button>
                    </div>
                  </Tabs.Content>
                </Tabs.Root>

                {msg && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-center font-semibold"
                    style={{ color: ["!", "uploaded", "removed", "added"].some(w => msg.includes(w)) ? "#22c55e" : "#ef4444" }}>
                    {msg}
                  </motion.p>
                )}

                <div>
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {photos.length} photo{photos.length !== 1 ? "s" : ""} in this land
                  </h3>
                  {photosLoading && (
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl animate-pulse"
                          style={{ background: "rgba(255,255,255,0.08)" }} />
                      ))}
                    </div>
                  )}
                  {!photosLoading && photos.length === 0 && (
                    <div className="flex flex-col items-center py-12 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                      <ImageOff size={36} style={{ color: "rgba(255,255,255,0.15)", marginBottom: "0.75rem" }} />
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>No photos yet — add the first one above</p>
                    </div>
                  )}
                  {!photosLoading && photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {photos.map((photo) => (
                          <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative group rounded-xl overflow-hidden aspect-square bg-black/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.url} alt={photo.caption ?? "Land photo"} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              aria-label="Remove photo"
                              title="Remove photo"
                              onClick={() => deletePhoto(photo.id)}
                              className="absolute top-2 right-2 z-10 p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              style={{
                                background: "rgba(239,68,68,0.92)",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                              }}
                            >
                              <Trash2 size={16} color="#fff" />
                            </button>
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                                style={{ background: "rgba(0,0,0,0.55)" }}>
                                Remove photo
                              </span>
                            </div>
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-xs truncate"
                                style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.85)" }}>
                                {photo.caption}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
