"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ImageIcon, Loader2, MessageCircle } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { muatFeed } from "@/server/feed";
import type { ItemFeed } from "@/lib/feed";

const JEDA_CEK = 30_000;

type Props = {
  tab: "post" | "connex";
  awal: ItemFeed[];
  kursorAwal: string | null;
  masuk: boolean;
  idSaya: string | null;
  koordinator: boolean;
  penulisId?: string;
};

export function DaftarFeed({ tab, awal, kursorAwal, masuk, idSaya, koordinator, penulisId }: Props) {
  const router = useRouter();
  const [item, setItem] = useState(awal);
  const [kursor, setKursor] = useState(kursorAwal);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const [baru, setBaru] = useState<{ n: number; lebih: boolean } | null>(null);
  const kursorRef = useRef(kursorAwal);
  const sibuk = useRef(false);
  const penanda = useRef<HTMLDivElement>(null);
  const kursorTeratas = awal[0]?.kursor ?? null;

  const muat = useCallback(async () => {
    const k = kursorRef.current;
    if (!k || sibuk.current) return;
    sibuk.current = true;
    setMemuat(true);
    setGalat("");
    try {
      const hasil = await muatFeed(tab === "connex" ? "CONNEX" : "POST", k, penulisId);
      if (!hasil.ok) {
        setGalat(hasil.pesan);
        return;
      }
      setItem((lama) => {
        const ada = new Set(lama.map((x) => x.id));
        return [...lama, ...hasil.item.filter((x) => !ada.has(x.id))];
      });
      kursorRef.current = hasil.kursorBerikut;
      setKursor(hasil.kursorBerikut);
    } catch {
      setGalat("Gagal memuat. Coba lagi.");
    } finally {
      sibuk.current = false;
      setMemuat(false);
    }
  }, [tab, penulisId]);

  useEffect(() => {
    const el = penanda.current;
    if (!el || !kursor || galat) return;
    const pengamat = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) void muat();
      },
      { rootMargin: "400px" },
    );
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, [kursor, galat, item.length, muat]);

  useEffect(() => {
    function saatHapus(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      setItem((lama) => lama.filter((x) => x.id !== id));
    }
    window.addEventListener("post-dihapus", saatHapus);
    return () => window.removeEventListener("post-dihapus", saatHapus);
  }, []);

  useEffect(() => {
    if (penulisId) return;
    const tipe = tab === "connex" ? "CONNEX" : "POST";
    let aktif = true;
    let sedangCek = false;

    async function cek() {
      if (sedangCek || document.visibilityState !== "visible") return;
      sedangCek = true;
      try {
        const q = new URLSearchParams({ tipe });
        if (kursorTeratas) q.set("kursor", kursorTeratas);
        const r = await fetch(`/api/feed-baru?${q}`, { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { n: number; lebih: boolean };
        if (aktif) setBaru(data.n > 0 ? data : null);
      } catch {
        // diam-diam, dicoba lagi di putaran berikutnya
      } finally {
        sedangCek = false;
      }
    }

    function saatTampil() {
      if (document.visibilityState === "visible") void cek();
    }

    const timer = setInterval(() => void cek(), JEDA_CEK);
    document.addEventListener("visibilitychange", saatTampil);
    return () => {
      aktif = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTampil);
    };
  }, [tab, kursorTeratas, penulisId]);

  function tampilkan() {
    setBaru(null);
    window.scrollTo({ top: 0 });
    router.refresh();
  }

  const namaBaru = tab === "connex" ? "Connex" : "post";
  const pita = baru && (
    <div className="sticky top-3 z-10 flex justify-center">
      <button
        type="button"
        onClick={tampilkan}
        className="bg-brand-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        <ArrowUp className="size-4" />
        {baru.n}
        {baru.lebih ? "+" : ""} {namaBaru} baru · Tampilkan
      </button>
    </div>
  );

  if (item.length === 0 && !kursor) {
    return (
      <div className="space-y-4">
        {pita}
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
          {tab === "post" ? (
            <ImageIcon className="size-10 opacity-40" />
          ) : (
            <MessageCircle className="size-10 opacity-40" />
          )}
          <p>{tab === "post" ? "Belum ada post foto." : "Belum ada Connex."}</p>
          {!penulisId && <p>Jadilah yang pertama berbagi cerita.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pita}

      {item.map((d) => (
        <PostCard
          key={d.id}
          data={d}
          masuk={masuk}
          bolehHapus={idSaya === d.penulisId || koordinator}
          moderasi={koordinator && idSaya !== d.penulisId}
        />
      ))}

      {kursor && <div ref={penanda} aria-hidden className="h-px" />}

      {memuat && (
        <div className="flex justify-center py-4" role="status" aria-label="Memuat">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}

      {galat && (
        <div role="alert" className="flex flex-col items-center gap-2 py-4 text-sm">
          <p className="text-destructive">{galat}</p>
          <button
            type="button"
            onClick={() => void muat()}
            className="rounded-lg border px-4 py-2 font-semibold"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!kursor && item.length > 0 && (
        <p className="text-muted-foreground py-6 text-center text-sm">Kamu sudah sampai di akhir.</p>
      )}
    </div>
  );
}