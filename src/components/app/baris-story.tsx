"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { BuatStory } from "./buat-story";
import { PenampilStory } from "./penampil-story";
import type { GrupStory } from "@/lib/story";

const KUNCI = "story-dilihat";

function bacaDilihat(): string[] {
  try {
    const r = localStorage.getItem(KUNCI);
    const a: unknown = r ? JSON.parse(r) : [];
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function simpanDilihat(a: string[]) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(a.slice(-500)));
  } catch {}
}

function Cincin({
  belum,
  tanpa = false,
  children,
}: {
  belum: boolean;
  tanpa?: boolean;
  children: React.ReactNode;
}) {
  const warna = tanpa ? "bg-transparent" : belum ? "bg-brand-gradient" : "bg-muted-foreground/30";
  return (
    <span className={`block rounded-full p-[3px] ${warna}`}>
      <span className="bg-background block rounded-full p-0.5">{children}</span>
    </span>
  );
}

const kelasItem = "flex w-[68px] shrink-0 flex-col items-center gap-1 text-center";
const kelasLabel = "w-full truncate text-[11px]";

export function BarisStory({
  grup,
  masuk,
  idSaya,
  koordinator,
  saya,
}: {
  grup: GrupStory[];
  masuk: boolean;
  idSaya: string | null;
  koordinator: boolean;
  saya: { nama: string; foto: string | null } | null;
}) {
  const [dilihat, setDilihat] = useState<string[]>([]);
  const [indeks, setIndeks] = useState<number | null>(null);
  const [buat, setBuat] = useState(false);
  const gulung = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDilihat(bacaDilihat());
  }, []);

  const lihat = useCallback((id: string) => {
    setDilihat((d) => {
      if (d.includes(id)) return d;
      const n = [...d, id];
      simpanDilihat(n);
      return n;
    });
  }, []);

  const milik = grup.find((g) => g.userId === idSaya) ?? null;
  const lainnya = grup.filter((g) => g.userId !== idSaya);
  const urut = milik ? [milik, ...lainnya] : lainnya;
  const belum = (g: GrupStory) => g.stories.some((s) => !dilihat.includes(s.id));

  function geser(arah: number) {
    gulung.current?.scrollBy({ left: arah * 240, behavior: "smooth" });
  }

  return (
    <>
      <div className="relative">
        <div ref={gulung} className="flex gap-3 overflow-x-auto pb-2" aria-label="Story">
          <div className={`${kelasItem} relative`}>
            {masuk ? (
              <>
                <button
                  type="button"
                  onClick={() => (milik ? setIndeks(0) : setBuat(true))}
                  aria-label={milik ? "Lihat story kamu" : "Buat story"}
                >
                  <Cincin belum={milik ? belum(milik) : false} tanpa={!milik}>
                    <AvatarInisial nama={saya?.nama ?? ""} foto={saya?.foto ?? null} ukuran={56} />
                  </Cincin>
                </button>
                <button
                  type="button"
                  onClick={() => setBuat(true)}
                  aria-label="Tambah story"
                  className="bg-primary border-background absolute top-11 right-1 flex size-5 items-center justify-center rounded-full border-2 text-white"
                >
                  <Plus className="size-3" />
                </button>
                <span className={kelasLabel}>Story kamu</span>
              </>
            ) : (
              <>
                <Link href="/daftar" aria-label="Daftar untuk membuat story">
                  <Cincin belum={false} tanpa>
                    <span className="bg-muted flex size-14 items-center justify-center rounded-full">
                      <Plus className="size-6" />
                    </span>
                  </Cincin>
                </Link>
                <span className={kelasLabel}>Buat story</span>
              </>
            )}
          </div>

          {lainnya.map((g) => {
            const isi = (
              <>
                <Cincin belum={belum(g)}>
                  <AvatarInisial nama={g.nama} foto={g.foto} ukuran={56} />
                </Cincin>
                <span className={kelasLabel}>{g.username ?? g.nama}</span>
              </>
            );
            return masuk ? (
              <button
                key={g.userId}
                type="button"
                onClick={() => setIndeks(urut.indexOf(g))}
                aria-label={`Lihat story ${g.nama}`}
                className={kelasItem}
              >
                {isi}
              </button>
            ) : (
              <Link key={g.userId} href="/daftar" aria-label="Daftar untuk melihat story" className={kelasItem}>
                {isi}
              </Link>
            );
          })}
        </div>

        {urut.length > 4 && (
          <>
            <button
              type="button"
              onClick={() => geser(-1)}
              aria-label="Geser ke kiri"
              className="bg-background absolute top-7 left-0 hidden size-7 items-center justify-center rounded-full border shadow md:flex"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => geser(1)}
              aria-label="Geser ke kanan"
              className="bg-background absolute top-7 right-0 hidden size-7 items-center justify-center rounded-full border shadow md:flex"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {masuk && indeks !== null && (
        <PenampilStory
          grup={urut}
          mulai={indeks}
          idSaya={idSaya}
          koordinator={koordinator}
          tutup={() => setIndeks(null)}
          saatLihat={lihat}
        />
      )}
      {masuk && <BuatStory buka={buat} tutup={() => setBuat(false)} />}
    </>
  );
}