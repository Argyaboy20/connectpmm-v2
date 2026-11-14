"use server";

import { bacaKursor } from "@/lib/feed";
import { ambilLog, type HasilLog } from "@/lib/log";
import { ambilPelaku } from "@/lib/pelaku";

export type HasilMuatLog = ({ ok: true } & HasilLog) | { ok: false; pesan: string };

export async function muatLog(kursor: string): Promise<HasilMuatLog> {
  const p = await ambilPelaku();
  if (!p) return { ok: false, pesan: "Masuk dulu." };
  if (p.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };
  if (p.role !== "KOORDINATOR") return { ok: false, pesan: "Kamu tidak berhak melihat log." };

  const k = bacaKursor(kursor);
  if (!k) return { ok: false, pesan: "Permintaan tidak valid." };

  return { ok: true, ...(await ambilLog({ kursor: k })) };
}