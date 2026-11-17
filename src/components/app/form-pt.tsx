"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ubahPt } from "@/server/akun";

export function FormPt({
  peran,
  status,
  ptPengirim,
  ptPenerima,
  daftarPt,
}: {
  peran: "PESERTA" | "KOORDINATOR";
  status: "PENGIRIM" | "PENERIMA" | null;
  ptPengirim: string;
  ptPenerima: string;
  daftarPt: string[];
}) {
  const router = useRouter();
  const [pengirim, setPengirim] = useState(ptPengirim);
  const [penerima, setPenerima] = useState(ptPenerima);
  const [pesan, setPesan] = useState("");
  const [ok, setOk] = useState(false);
  const [proses, mulai] = useTransition();

  const tampilPengirim = peran === "PESERTA" || status === "PENGIRIM";
  const tampilPenerima = peran === "PESERTA" || status === "PENERIMA";
  const berubah =
    (tampilPengirim && pengirim.trim() !== ptPengirim) || (tampilPenerima && penerima.trim() !== ptPenerima);

  function simpan() {
    setPesan("");
    setOk(false);
    mulai(async () => {
      const h = await ubahPt({
        ptPengirim: tampilPengirim ? pengirim : undefined,
        ptPenerima: tampilPenerima ? penerima : undefined,
      });
      if (h.ok) {
        setOk(true);
        router.refresh();
      } else setPesan(h.pesan);
    });
  }

  const kolom = "h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none";

  return (
    <div className="space-y-3">
      <datalist id="daftar-pt-akun">
        {daftarPt.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      {tampilPengirim && (
        <div>
          <label htmlFor="pt-pengirim" className="text-sm font-semibold">
            PT Pengirim
          </label>
          <input
            id="pt-pengirim"
            list="daftar-pt-akun"
            value={pengirim}
            onChange={(e) => setPengirim(e.target.value)}
            maxLength={150}
            className={`${kolom} mt-1`}
          />
        </div>
      )}
      {tampilPenerima && (
        <div>
          <label htmlFor="pt-penerima" className="text-sm font-semibold">
            PT Penerima
          </label>
          <input
            id="pt-penerima"
            list="daftar-pt-akun"
            value={penerima}
            onChange={(e) => setPenerima(e.target.value)}
            maxLength={150}
            className={`${kolom} mt-1`}
          />
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Perubahan data PT tercatat di log Moderasi. Tidak ada dalam daftar? Ketik sendiri nama PT-nya.
      </p>
      {pesan && (
        <p role="alert" className="text-destructive text-sm">
          {pesan}
        </p>
      )}
      {ok && !berubah && <p className="text-sm text-emerald-600">Tersimpan.</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={simpan}
          disabled={proses || !berubah}
          className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {proses && <Loader2 className="size-4 animate-spin" />}
          Simpan
        </button>
      </div>
    </div>
  );
}