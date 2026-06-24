import type { NFCReadResult, NFCPayload } from "@/lib/types";

export class NFCNotSupportedError extends Error {
  constructor() { super("Web NFC API not supported on this device/browser"); }
}

export class NFCPermissionError extends Error {
  constructor() { super("NFC permission denied"); }
}

export async function readNFCWristband(): Promise<NFCReadResult> {
  if (!("NDEFReader" in window)) throw new NFCNotSupportedError();

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reader = new (window as any).NDEFReader();

    reader.scan().then(() => {
      reader.onreadingerror = () => reject(new Error("Failed to read NFC tag"));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reader.onreading = (event: any) => {
        try {
          const record = event.message.records[0];
          const decoder = new TextDecoder();
          const rawRecord = decoder.decode(record.data);
          const payload: NFCPayload = JSON.parse(rawRecord);
          resolve({ profileId: payload.pid, season: payload.season, rawRecord });
        } catch {
          reject(new Error("Invalid wristband data format"));
        }
      };
    }).catch((err: Error) => {
      if (err.name === "NotAllowedError") reject(new NFCPermissionError());
      else reject(err);
    });
  });
}

export function isNFCSupported(): boolean {
  return "NDEFReader" in window;
}
