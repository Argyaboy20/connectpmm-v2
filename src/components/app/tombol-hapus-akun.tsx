"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { hapusAkun } from "@/server/hapus-akun";

export function TombolHapusAkun() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [teks, setTeks] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);

  async function konfirmasi() {
    setPesan("");
    setProses(true);
    try {
      const h = await hapusAkun(teks);
      if (!h.ok) {
        setPesan(h.pesan);
        setProses(false);
        return;
      }
      await authClient.signOut().catch(() => {});
      window.location.href = "/masuk";
    } catch {
      setPesan("Gagal menghapus akun. Coba lagi.");
      setProses(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTeks("");
          setPesan("");
          dialog.current?.showModal();
        }}
        className="text-destructive hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold sm:h-9 sm:gap-2 sm:px-4 sm:text-sm"
      >
        <Trash2 className="size-3.5 sm:size-4" />
        Hapus akun
      </button>

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,26rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">Hapus akun permanen?</h2>
        <p className="mt-2 text-sm font-medium">Tindakan ini tidak bisa dibatalkan.</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Akunmu, foto profil, semua post, Connex, komentar, suka, pengikut, notifikasi, laporan, dan
          percakapan Pesan akan dihapus permanen. Percakapanmu juga hilang di sisi lawan bicara.
        </p>

        <label htmlFor="konfirmasi-hapus" className="mt-4 block text-sm font-semibold">
          Ketik HAPUS untuk melanjutkan
        </label>
        <input
          id="konfirmasi-hapus"
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          disabled={proses}
          className="mt-1 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none"
        />

        {pesan && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {pesan}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            disabled={proses}
            className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={konfirmasi}
            disabled={proses || teks.trim() !== "HAPUS"}
            className="bg-destructive inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Hapus permanen
          </button>
        </div>
      </dialog>
    </>
  );
}