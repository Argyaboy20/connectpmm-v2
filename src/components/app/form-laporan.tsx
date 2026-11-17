"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  BATAS_FOTO,
  BATAS_JUDUL_LAPORAN,
  BATAS_LOKASI_LAPORAN,
  BATAS_TOTAL_FOTO,
  BATAS_URAIAN_LAPORAN,
} from "@/lib/batas";
import { kompresFoto } from "@/lib/kompres-gambar";

type Pilihan = { id: string; file: File; url: string };

const kolom = "h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none";

export function FormLaporan({ maks }: { maks: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pilihan, setPilihan] = useState<Pilihan[]>([]);
  const [judul, setJudul] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [uraian, setUraian] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);

  const terakhir = useRef<Pilihan[]>([]);
  useEffect(() => {
    terakhir.current = pilihan;
  }, [pilihan]);
  useEffect(() => () => terakhir.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const penuh = pilihan.length >= BATAS_FOTO;
  const lengkap =
    judul.trim() && tanggal && lokasi.trim() && uraian.trim() && pilihan.length > 0;

  function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setPesan("");
    const muat = Math.max(0, BATAS_FOTO - pilihan.length);
    if (files.length > muat) setPesan(`Maksimal ${BATAS_FOTO} foto.`);
    const baru = files.slice(0, muat).map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    setPilihan((p) => [...p, ...baru]);
  }

  function buang(id: string) {
    setPilihan((p) => {
      const target = p.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return p.filter((x) => x.id !== id);
    });
    setPesan("");
  }

  async function kirim() {
    setPesan("");
    setProses(true);
    try {
      const form = new FormData();
      form.append("judul", judul);
      form.append("tanggal", tanggal);
      form.append("lokasi", lokasi);
      form.append("uraian", uraian);
      const batas = Math.floor(BATAS_TOTAL_FOTO / pilihan.length);
      for (const p of pilihan) {
        const hasil = await kompresFoto(p.file, batas);
        form.append("foto", hasil.blob, "foto");
        form.append("lebar", String(hasil.lebar));
        form.append("tinggi", String(hasil.tinggi));
      }
      const r = await fetch("/api/laporan", { method: "POST", body: form });
      const data = (await r.json().catch(() => null)) as { ok: boolean; pesan?: string } | null;
      if (!r.ok || !data?.ok) {
        setPesan(data?.pesan ?? "Gagal mengirim laporan. Coba lagi.");
        return;
      }
      router.push("/laporan");
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-2xl border p-4">
        <div>
          <label htmlFor="judul" className="text-sm font-semibold">
            Judul kegiatan
          </label>
          <input
            id="judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            maxLength={BATAS_JUDUL_LAPORAN}
            disabled={proses}
            className={`${kolom} mt-1`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tanggal" className="text-sm font-semibold">
              Tanggal kegiatan
            </label>
            <input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              min="2020-01-01"
              max={maks}
              disabled={proses}
              className={`${kolom} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="lokasi" className="text-sm font-semibold">
              Lokasi
            </label>
            <input
              id="lokasi"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              maxLength={BATAS_LOKASI_LAPORAN}
              disabled={proses}
              className={`${kolom} mt-1`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="uraian" className="text-sm font-semibold">
            Uraian kegiatan
          </label>
          <textarea
            id="uraian"
            value={uraian}
            onChange={(e) => setUraian(e.target.value)}
            maxLength={BATAS_URAIAN_LAPORAN}
            rows={6}
            disabled={proses}
            className="mt-1 w-full resize-none rounded-lg border bg-transparent p-3 text-sm outline-none"
          />
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {BATAS_URAIAN_LAPORAN - uraian.length}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={pilih}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={penuh || proses}
        className="hover:bg-muted flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed py-8 text-sm disabled:opacity-50"
      >
        <ImagePlus className="text-muted-foreground size-8" />
        <span className="font-semibold">Pilih foto dokumentasi</span>
        <span className="text-muted-foreground text-xs">
          {pilihan.length}/{BATAS_FOTO} foto (minimal 1)
        </span>
      </button>

      {pilihan.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {pilihan.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="Pratinjau foto" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => buang(p.id)}
                disabled={proses}
                aria-label="Buang foto"
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {pesan && (
        <p role="alert" className="text-destructive text-sm">
          {pesan}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={kirim}
          disabled={!lengkap || proses}
          className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {proses && <Loader2 className="size-4 animate-spin" />}
          Kirim laporan
        </button>
      </div>
    </div>
  );
}