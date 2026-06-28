"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, CheckCircle, AlertCircle, RefreshCw, QrCode } from "lucide-react";
import { useNFC } from "@/hooks/use-nfc";

interface Props {
  onScan: (profileId: string) => void;
  mode?: "checkin" | "land" | "checkout" | "register";
  onQRFallback?: () => void;
}

const MODE_LABELS: Record<string, string> = {
  checkin:  "Check In",
  land:     "Start Land",
  checkout: "Check Out",
  register: "Register Wristband",
};

export default function NFCScanner({ onScan, mode = "checkin", onQRFallback }: Props) {
  const { status, error, isSupported, startScan, reset } = useNFC();

  const handleStartScan = useCallback(() => {
    if (!isSupported) {
      onQRFallback?.();
      return;
    }
    startScan((result) => {
      onScan(result.profileId);
    });
  }, [isSupported, startScan, onScan, onQRFallback]);

  const isScanning = status === "scanning";
  const isSuccess  = status === "success";
  const isError    = status === "error";

  const circleColor =
    isSuccess ? "#22c55e" :
    isError   ? "#ef4444" :
    "var(--color-sphere-coral)";

  const ringDuration = isScanning ? "0.9s" : "1.5s";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
        padding: "2.5rem 1.5rem",
      }}
    >
      {/* Mode label */}
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--color-sphere-gold)",
          background: "rgba(212,168,67,0.1)",
          border: "1px solid rgba(212,168,67,0.25)",
          borderRadius: 999,
          padding: "0.3rem 1rem",
        }}
      >
        {MODE_LABELS[mode]}
      </div>

      {/* NFC Circle + ping rings */}
      <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
        {/* Ping rings — only visible when idle or scanning */}
        {!isSuccess && !isError && (
          <>
            {[0, 0.5, 1].map((delay) => (
              <span
                key={delay}
                className="animate-nfc-ping"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2px solid ${circleColor}`,
                  animationDelay: `${delay}s`,
                  animationDuration: ringDuration,
                  opacity: 0,
                }}
              />
            ))}
          </>
        )}

        {/* Center circle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${circleColor}22 0%, ${circleColor}10 60%, transparent 100%)`,
              border: `3px solid ${circleColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 40px ${circleColor}50, 0 0 80px ${circleColor}20`,
            }}
          >
            {isSuccess ? (
              <CheckCircle size={64} color="#22c55e" strokeWidth={1.5} />
            ) : isError ? (
              <AlertCircle size={64} color="#ef4444" strokeWidth={1.5} />
            ) : (
              <Wifi
                size={72}
                color={circleColor}
                strokeWidth={1.5}
                style={{ transform: "rotate(90deg)" }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${status}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{ textAlign: "center" }}
        >
          {status === "idle" && (
            <p style={{ color: "var(--color-text-light)", fontSize: "1rem", margin: 0 }}>
              Tap a wristband to the device to scan
            </p>
          )}
          {isScanning && (
            <p
              style={{
                color: "var(--color-sphere-coral)",
                fontSize: "1rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Scanning... hold wristband steady
            </p>
          )}
          {isSuccess && (
            <p
              style={{
                color: "#22c55e",
                fontSize: "1.1rem",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Wristband read successfully
            </p>
          )}
          {isError && (
            <p style={{ color: "#ef4444", fontSize: "0.95rem", margin: 0, maxWidth: 280 }}>
              {error ?? "Could not read wristband. Try again."}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
        {(status === "idle" || isError) && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={isError ? reset : handleStartScan}
            style={{
              padding: "0.875rem 2.5rem",
              borderRadius: 12,
              background: isError
                ? "rgba(239,68,68,0.15)"
                : "var(--color-sphere-coral)",
              border: isError ? "1.5px solid #ef4444" : "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              letterSpacing: "0.04em",
            }}
          >
            {isError ? (
              <>
                <RefreshCw size={16} />
                Try Again
              </>
            ) : (
              <>
                <Wifi size={16} style={{ transform: "rotate(90deg)" }} />
                {isSupported ? "Start Scanning" : "NFC Not Available"}
              </>
            )}
          </motion.button>
        )}

        {/* QR fallback */}
        {onQRFallback && (
          <button
            onClick={onQRFallback}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.5rem",
              borderRadius: 6,
              textDecoration: "underline",
              textDecorationColor: "rgba(100,116,139,0.4)",
              textUnderlineOffset: "3px",
            }}
          >
            <QrCode size={13} />
            Scan QR code instead
          </button>
        )}
      </div>
    </div>
  );
}

export function QRFallbackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: "var(--color-text-muted)",
        fontSize: "0.82rem",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.25rem 0.5rem",
        textDecoration: "underline",
        textDecorationColor: "rgba(100,116,139,0.4)",
        textUnderlineOffset: "3px",
      }}
    >
      <QrCode size={13} />
      Scan QR code instead
    </button>
  );
}
