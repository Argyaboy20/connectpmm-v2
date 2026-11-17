"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { BATAS_CAPTION_STORY, BATAS_FOTO_STORY } from "@/lib/batas";
import { kompresFoto } from "@/lib/kompres-gambar";

export function BuatStory({ buka, tutup }: { buka: boolean; tutup: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const kamera = useRef<HTMLInputElement>(null);
  const galeri = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (buka && !d.open) d.showModal();
    if (!buka && d.open) d.close();
  }, [buka]);

  function reset() {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setFile(null);
    setCaption("");
    setPesan("");
  }

  function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (url) URL.revokeObjectURL(url);
    setPesan("");
    setFile(f);
    setUrl(URL.createObjectURL(f));
  }

  async function kirim() {
    if (!file) return;
    setPesan("");
    setProses(true);
    try {
      const hasil = await kompresFoto(file, BATAS_FOTO_STORY);
      const form = new FormData();
      form.append("foto", hasil.blob, "foto");
      form.append("lebar", String(hasil.lebar));
      form.append("tinggi", String(hasil.tinggi));
      form.append("caption", caption);
      const r = await fetch("/api/story", { method: "POST", body: form });
      const data = (await r.json().catch(() => null)) as { ok: boolean; pesan?: string } | null;
      if (!r.ok || !data?.ok) {
        setPesan(data?.pesan ?? "Gagal membagikan story. Coba lagi.");
        return;
      }
      dialog.current?.close();
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  const sisa = BATAS_CAPTION_STORY - caption.length;

  return (
    <dialog
      ref={dialog}
      onClose={() => {
        reset();
        tutup();
      }}
      className="bg-background text-foreground m-auto w-[min(92vw,26rem)] rounded-2xl border p-5 shadow-lg backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Buat story</h2>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          disabled={proses}
          aria-label="Tutup"
          className="hover:bg-muted rounded-full p-1.5"
        >
          <X className="size-5" />
        </button>
      </div>

      <input ref={kamera} type="file" accept="image/*" capture="environment" hidden onChange={pilih} />
      <input
        ref={galeri}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={pilih}
      />

      {!url ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => kamera.current?.click()}
            className="hover:bg-muted flex flex-col items-center gap-2 rounded-2xl border border-dashed py-8 text-sm font-semibold"
          >
            <Camera className="text-muted-foreground size-7" />
            Kamera
          </button>
          <button
            type="button"
            onClick={() => galeri.current?.click()}
            className="hover:bg-muted flex flex-col items-center gap-2 rounded-2xl border border-dashed py-8 text-sm font-semibold"
          >
            <ImagePlus className="text-muted-foreground size-7" />
            Galeri
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="relative flex h-[45vh] items-center justify-center overflow-hidden rounded-xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Pratinjau story" className="size-full object-contain" />
            <button
              type="button"
              onClick={reset}
              disabled={proses}
              aria-label="Buang foto"
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="size-4" />
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={BATAS_CAPTION_STORY}
            rows={2}
            placeholder="Tulis caption (opsional)"
            aria-label="Caption story"
            disabled={proses}
            className="placeholder:text-muted-foreground w-full resize-none rounded-lg border bg-transparent p-2 text-sm outline-none"
          />
          <p className={`text-right text-xs ${sisa <= 20 ? "text-amber-600" : "text-muted-foreground"}`}>
            {sisa}
          </p>
        </div>
      )}

      {pesan && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {pesan}
        </p>
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        Story hilang otomatis setelah 24 jam dan hanya bisa dilihat akun yang sudah masuk.
      </p>

      {url && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={kirim}
            disabled={proses}
            className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Bagikan
          </button>
        </div>
      )}
    </dialog>
  );
}