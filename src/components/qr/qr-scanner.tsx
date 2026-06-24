"use client";
import { useEffect, useRef } from "react";

interface Props {
  onScan: (profileId: string) => void;
  onError?: (error: string) => void;
}

export default function QrScanner({ onScan, onError }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  // Keep a stable callback ref so we can safely clean up
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any;

    async function init() {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        scanner.render(
          (decodedText: string) => {
            try {
              const parsed = JSON.parse(decodedText) as Record<string, unknown>;
              const profileId =
                typeof parsed.pid === "string"
                  ? parsed.pid
                  : decodedText;
              onScanRef.current(profileId);
            } catch {
              // raw UUID or profile URL
              const uuidMatch = decodedText.match(
                /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
              );
              onScanRef.current(uuidMatch ? uuidMatch[0] : decodedText);
            }
          },
          (_err: unknown) => {
            // Continuous scan errors are noisy — only surface critical ones
          }
        );
      } catch (err) {
        onErrorRef.current?.(err instanceof Error ? err.message : "QR scanner failed to load");
      }
    }

    init();

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", maxWidth: 350, margin: "0 auto" }}>
      {/* Decorative gradient border frame */}
      <div
        style={{
          position: "absolute",
          top: -6,
          left: -6,
          right: -6,
          bottom: -6,
          borderRadius: 12,
          background: `linear-gradient(var(--color-dark), var(--color-dark)) padding-box,
                       linear-gradient(135deg, var(--color-sphere-coral), var(--color-sphere-gold)) border-box`,
          border: "2px solid transparent",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Corner bracket accents */}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
        const isTop    = corner.startsWith("top");
        const isLeft   = corner.endsWith("left");
        return (
          <div
            key={corner}
            style={{
              position: "absolute",
              width: 20,
              height: 20,
              [isTop ? "top" : "bottom"]: -4,
              [isLeft ? "left" : "right"]: -4,
              borderTop:    isTop  ? "3px solid var(--color-sphere-coral)" : "none",
              borderBottom: !isTop ? "3px solid var(--color-sphere-coral)" : "none",
              borderLeft:   isLeft  ? "3px solid var(--color-sphere-coral)" : "none",
              borderRight:  !isLeft ? "3px solid var(--color-sphere-coral)" : "none",
              borderRadius: isTop && isLeft ? "6px 0 0 0" : isTop ? "0 6px 0 0" : isLeft ? "0 0 0 6px" : "0 0 6px 0",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
        );
      })}

      <div
        id="qr-reader"
        ref={scannerRef}
        style={{ position: "relative", zIndex: 1, borderRadius: 8, overflow: "hidden" }}
      />
    </div>
  );
}
