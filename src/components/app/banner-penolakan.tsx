"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ajukanPeserta, tutupPenolakan } from "@/server/verifikasi";

const kolom = "h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none";

export function BannerPenolakan({ role, alasan }: { role: string | null; alasan: string }) {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  const [form, setForm] = useState(false);
  const [nim, setNim] = useState("");
  const [pengirim, setPengirim] = useState("");
  const [penerima, setPenerima] = useState("");
  const [pesan, setPesan] = useState("");

  const koordinator = role === "KOORDINATOR";

  function tutup() {
    mulai(async () => {
      await tutupPenolakan();
      router.refresh();
    });
  }

  function ajukan() {
    setPesan("");
    mulai(async () => {
      const h = await ajukanPeserta({ nim, ptPengirim: pengirim, ptPenerima: penerima });
      if (!h.ok) {
        setPesan(h.pesan);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      role="status"
      className="border-destructive/30 bg-destructive/10 mb-4 space-y-3 rounded-xl border px-4 py-3 text-sm"
    >
      <p>
        Permohonanmu sebagai <strong>{koordinator ? "Koordinator" : "Peserta"}</strong> ditolak. Alasan:{" "}
        {alasan}
      </p>
      <p>
        {koordinator
          ? "Kamu bisa mengajukan sebagai Peserta, atau tetap memakai PMM Connect sebagai Umum."
          : "Kamu tetap bisa memakai PMM Connect sebagai Umum."}
      </p>

      {form && (
        <div className="space-y-2">
          <input
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            maxLength={30}
            placeholder="NIM"
            aria-label="NIM"
            className={kolom}
          />
          <input
            value={pengirim}
            onChange={(e) => setPengirim(e.target.value)}
            maxLength={150}
            placeholder="PT Pengirim"
            aria-label="PT Pengirim"
            className={kolom}
          />
          <input
            value={penerima}
            onChange={(e) => setPenerima(e.target.value)}
            maxLength={150}
            placeholder="PT Penerima"
            aria-label="PT Penerima"
            className={kolom}
          />
          {pesan && (
            <p role="alert" className="text-destructive">
              {pesan}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {koordinator && !form && (
          <button
            type="button"
            onClick={() => setForm(true)}
            className="bg-brand-gradient rounded-lg px-3 py-1.5 font-semibold text-white"
          >
            Ajukan sebagai Peserta
          </button>
        )}
        {koordinator && form && (
          <button
            type="button"
            onClick={ajukan}
            disabled={proses || !nim.trim() || !pengirim.trim() || !penerima.trim()}
            className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-3 py-1.5 font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Kirim pengajuan
          </button>
        )}
        <button
          type="button"
          onClick={tutup}
          disabled={proses}
          className="rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50"
        >
          {koordinator ? "Tetap sebagai Umum" : "Mengerti"}
        </button>
      </div>
    </div>
  );
}