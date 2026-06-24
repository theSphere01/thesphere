"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { hexToRgba } from "@/lib/utils";
import type { LandPhoto } from "@/lib/types";

interface PhotoGalleryProps {
  landId: string;
  landColor: string;
  landEmoji?: string;
}

export function PhotoGallery({ landId, landColor, landEmoji = "📷" }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<LandPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/lands/${landId}/photos`);
        if (res.ok) {
          const json = await res.json();
          setPhotos(json.data ?? []);
        }
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [landId]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }, [lightboxIndex, photos.length]);

  const nextPhoto = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }, [lightboxIndex, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "Escape")     closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, prevPhoto, nextPhoto]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl animate-pulse"
            style={{ background: hexToRgba(landColor, 0.12) }} />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
        style={{ background: hexToRgba(landColor, 0.06), border: `2px dashed ${hexToRgba(landColor, 0.3)}` }}
      >
        <span className="text-6xl mb-4">{landEmoji}</span>
        <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-text-muted)" }}>
          <ImageOff size={20} />
          <span className="text-lg font-semibold">Photos Coming Soon</span>
        </div>
        <p className="text-sm max-w-xs" style={{ color: "var(--color-text-light)" }}>
          We're capturing the magic happening here. Check back soon!
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Gallery grid — CSS columns for masonry effect */}
      <div className="columns-2 sm:columns-3 gap-4 space-y-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, boxShadow: `0 8px 32px ${hexToRgba(landColor, 0.4)}` }}
            onClick={() => openLightbox(index)}
            className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer block mb-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? `Photo ${index + 1}`}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog.Root open={lightboxIndex !== null} onOpenChange={(open) => { if (!open) closeLightbox(); }}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
            >
              {lightboxIndex !== null && (
                <div className="relative max-w-4xl w-full mx-4">
                  {/* Close */}
                  <button
                    onClick={closeLightbox}
                    className="absolute -top-12 right-0 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                    style={{ color: "#fff" }}
                  >
                    <X size={24} />
                  </button>

                  {/* Image */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={lightboxIndex}
                      src={photos[lightboxIndex].url}
                      alt={photos[lightboxIndex].caption ?? `Photo ${lightboxIndex + 1}`}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.2 }}
                      className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
                    />
                  </AnimatePresence>

                  {/* Caption */}
                  {photos[lightboxIndex].caption && (
                    <p className="text-center mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {photos[lightboxIndex].caption}
                    </p>
                  )}

                  {/* Nav arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 p-3 rounded-full hover:bg-white/10 transition-colors"
                        style={{ color: "#fff" }}
                      >
                        <ChevronLeft size={32} />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 p-3 rounded-full hover:bg-white/10 transition-colors"
                        style={{ color: "#fff" }}
                      >
                        <ChevronRight size={32} />
                      </button>
                    </>
                  )}

                  {/* Counter */}
                  <p className="text-center mt-2 text-xs" style={{ color: "var(--color-text-light)" }}>
                    {lightboxIndex + 1} / {photos.length}
                  </p>
                </div>
              )}
            </motion.div>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
