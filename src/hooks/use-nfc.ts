"use client";
import { useState, useCallback, useEffect } from "react";
import type { NFCReadResult } from "@/lib/types";

type NFCStatus = "idle" | "scanning" | "success" | "error";

export function useNFC() {
  const [status, setStatus] = useState<NFCStatus>("idle");
  const [lastRead, setLastRead] = useState<NFCReadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("NDEFReader" in window);
  }, []);

  const startScan = useCallback(async (onRead?: (result: NFCReadResult) => void) => {
    setStatus("scanning");
    setError(null);
    try {
      const { readNFCWristband } = await import("@/lib/nfc/nfc-reader");
      const result = await readNFCWristband();
      setLastRead(result);
      setStatus("success");
      onRead?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setLastRead(null);
    setError(null);
  }, []);

  return { status, lastRead, error, isSupported, startScan, reset };
}
