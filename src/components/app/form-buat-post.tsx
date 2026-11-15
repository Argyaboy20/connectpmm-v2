"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { BATAS_CAPTION, BATAS_FOTO, BATAS_TOTAL_FOTO } from "@/lib/batas";
import { kompresFoto } from "@/lib/kompres-gambar";

type Pilihan = { id: string; file: File; url: string };

export function FormBuatPost() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pilihan, setPilihan] = useState<Pilihan[]>([]);
  const [caption, setCaption] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);

  const terakhir = useRef<Pilihan[]>([]);
  useEffect(() => {
    terakhir.current = pilihan;
  }, [pilihan]);
  useEffect(() => () => terakhir.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const penuh = pilihan.length >= BATAS_FOTO;
  const sisa = BATAS_CAPTION - caption.length;

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
      form.append("caption", caption);
      const batas = Math.floor(BATAS_TOTAL_FOTO / pilihan.length);
      for (const p of pilihan) {
        const hasil = await kompresFoto(p.file, batas);
        form.append("foto", hasil.blob, "foto");
        form.append("lebar", String(hasil.lebar));
        form.append("tinggi", String(hasil.tinggi));
      }
      const r = await fetch("/api/post-foto", { method: "POST", body: form });
      const data = (await r.json().catch(() => null)) as { ok: boolean; pesan?: string } | null;
      if (!r.ok || !data?.ok) {
        setPesan(data?.pesan ?? "Gagal membagikan. Coba lagi.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="space-y-4">
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
        className="hover:bg-muted flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-sm disabled:opacity-50"
      >
        <ImagePlus className="text-muted-foreground size-8" />
        <span className="font-semibold">Pilih foto dari perangkat Anda</span>
        <span className="text-muted-foreground text-xs">
          {pilihan.length}/{BATAS_FOTO} foto
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

      <div className="rounded-2xl border p-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={BATAS_CAPTION}
          rows={3}
          placeholder="Tulis keterangan (opsional)"
          aria-label="Keterangan"
          className="placeholder:text-muted-foreground min-h-20 w-full resize-none bg-transparent outline-none"
        />
        {pesan && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {pesan}
          </p>
        )}
        <div className="mt-3 flex items-center justify-end gap-3 border-t pt-3">
          <span className={`text-xs ${sisa <= 50 ? "text-amber-600" : "text-muted-foreground"}`}>
            {sisa}
          </span>
          <button
            type="button"
            onClick={kirim}
            disabled={pilihan.length === 0 || proses}
            className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Bagikan
          </button>
        </div>
      </div>
    </div>
  );
}