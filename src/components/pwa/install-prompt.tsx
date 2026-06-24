"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setTimeout(() => setIsVisible(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="md:hidden"
          style={{
            position: "fixed",
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
            left: 16, right: 16,
            zIndex: 55,
            borderRadius: 20,
            overflow: "hidden",
            background: "linear-gradient(135deg, #FF6B47, #D4A843)",
            boxShadow: "0 20px 60px rgba(255,107,71,0.45)",
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: "1.5rem",
            }}>
              🌐
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: "0.85rem", margin: 0, lineHeight: 1.3 }}>
                Install The Sphere App
              </p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem", margin: "2px 0 0", lineHeight: 1.3 }}>
                Add to home screen for the best experience
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={handleInstall}
                className="tap-target"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "white", color: "#FF6B47",
                  fontSize: "0.78rem", fontWeight: 700,
                  padding: "8px 14px", borderRadius: 12,
                  border: "none", cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Download size={14} /> Install
              </button>
              <button
                onClick={handleDismiss}
                className="tap-target"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.9)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
