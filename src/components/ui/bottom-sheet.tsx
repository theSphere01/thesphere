"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: "half" | "full" | "auto";
}

export function BottomSheet({ isOpen, onClose, title, children, snapPoints = "auto" }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const heightMap = { half: "50vh", full: "92vh", auto: "auto" };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            style={{ background: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(20px)",
              maxHeight: heightMap[snapPoints],
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderBottom: "none",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 40, height: 4, borderRadius: 9999, background: "rgba(0,0,0,0.15)" }} />
            </div>

            {title && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-dark)", margin: 0 }}>{title}</h2>
                <button
                  onClick={onClose}
                  className="tap-target"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.06)",
                    color: "rgba(26,26,46,0.5)", cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="scroll-smooth-mobile allow-overscroll" style={{ overflowY: "auto", padding: "0 1.25rem 1rem" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
