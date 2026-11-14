"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { tutupPenolakan } from "@/server/verifikasi";

export function BannerPenolakan({ role, alasan }: { role: string | null; alasan: string }) {
  const router = useRouter();
  const [proses, mulai] = useTransition();

  function tutup() {
    mulai(async () => {
      await tutupPenolakan();
      router.refresh();
    });
  }

  return (
    <div
      role="status"
      className="border-destructive/30 bg-destructive/10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
    >
      <p className="min-w-0 flex-1">
        Permohonanmu sebagai <strong>{role === "KOORDINATOR" ? "Koordinator" : "Peserta"}</strong> ditolak.
        Alasan: {alasan}
      </p>
      <button
        type="button"
        onClick={tutup}
        disabled={proses}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50"
      >
        {proses && <Loader2 className="size-4 animate-spin" />}
        Mengerti
      </button>
    </div>
  );
}