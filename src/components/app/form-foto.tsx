"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { kompresAvatar } from "@/lib/kompres-gambar";

export function FormFoto({
  nama,
  foto,
  ukuran = 64,
}: {
  nama: string;
  foto: string | null;
  ukuran?: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPesan("");
    setProses(true);
    try {
      const blob = await kompresAvatar(file);
      const form = new FormData();
      form.append("foto", blob, "foto");
      const r = await fetch("/api/avatar", { method: "POST", body: form });
      const data = (await r.json().catch(() => null)) as { ok: boolean; pesan?: string } | null;
      if (!r.ok || !data?.ok) {
        setPesan(data?.pesan ?? "Gagal mengganti foto. Coba lagi.");
        return;
      }
      router.refresh();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  async function hapus() {
    setPesan("");
    setProses(true);
    try {
      const r = await fetch("/api/avatar", { method: "DELETE" });
      if (!r.ok) {
        setPesan("Gagal menghapus foto. Coba lagi.");
        return;
      }
      router.refresh();
    } catch {
      setPesan("Terjadi kesalahan. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={pilih}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={proses}
        aria-label="Ganti foto profil"
        className="relative rounded-full"
      >
        <AvatarInisial nama={nama} foto={foto} ukuran={ukuran} />
        <span className="bg-background absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border">
          {proses ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
        </span>
      </button>
      {foto && (
        <button
          type="button"
          onClick={hapus}
          disabled={proses}
          className="text-muted-foreground hover:text-foreground text-xs underline"
        >
          Hapus foto
        </button>
      )}
      {pesan && (
        <p role="alert" className="text-destructive max-w-40 text-xs">
          {pesan}
        </p>
      )}
    </div>
  );
}