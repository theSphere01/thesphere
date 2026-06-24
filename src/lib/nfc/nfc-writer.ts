import type { NFCPayload } from "@/lib/types";
import { CURRENT_SEASON } from "@/lib/constants";

export async function writeNFCWristband(profileId: string): Promise<void> {
  if (!("NDEFWriter" in window) && !("NDEFReader" in window)) {
    throw new Error("Web NFC API not supported");
  }

  const payload: NFCPayload = { v: 1, pid: profileId, season: CURRENT_SEASON };
  const data = JSON.stringify(payload);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writer = new (window as any).NDEFReader();
  await writer.write({
    records: [{ recordType: "text", data, lang: "en" }],
  });
}
