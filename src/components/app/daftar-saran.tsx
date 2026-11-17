"use client";

import { useState } from "react";
import Link from "next/link";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { TombolIkuti } from "@/components/app/tombol-ikuti";
import type { ItemSaran } from "@/lib/saran";

export function DaftarSaran({
  items,
  masuk,
  tata,
}: {
  items: ItemSaran[];
  masuk: boolean;
  tata: "kolom" | "baris";
}) {
  const [hilang, setHilang] = useState<string[]>([]);
  const tampil = items.filter((i) => !hilang.includes(i.id));
  if (tampil.length === 0) return null;

  const sembunyikan = (id: string) => setHilang((h) => [...h, id]);

  return (
    <section className={tata === "baris" ? "space-y-2 xl:hidden" : "space-y-3"}>
      <p className="text-muted-foreground text-xs font-semibold xl:text-sm">Disarankan untuk Anda</p>

      {tata === "kolom" ? (
        <ul className="space-y-3">
          {tampil.map((o) => (
            <li key={o.id} className="flex items-center gap-3">
              <Link href={`/profil/${o.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                <AvatarInisial nama={o.nama} foto={o.foto} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{o.nama}</p>
                  <p className="text-muted-foreground truncate text-xs">@{o.username}</p>
                  <div className="mt-0.5">
                    <RoleBadge role={o.role ?? "UMUM"} />
                  </div>
                </div>
              </Link>
              <TombolIkuti targetId={o.id} masuk={masuk} saatIkuti={() => sembunyikan(o.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
          {tampil.map((o) => (
            <li
              key={o.id}
              className="flex w-32 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border p-2.5 text-center"
            >
              <Link
                href={`/profil/${o.username}`}
                className="flex w-full min-w-0 flex-col items-center gap-1"
              >
                <AvatarInisial nama={o.nama} foto={o.foto} ukuran={40} />
                <p className="w-full text-xs leading-tight font-semibold [overflow-wrap:anywhere]">
                  {o.nama}
                </p>
                <p className="text-muted-foreground w-full text-[10px] leading-tight [overflow-wrap:anywhere]">
                  @{o.username}
                </p>
                <RoleBadge role={o.role ?? "UMUM"} />
              </Link>
              <div className="mt-auto">
                <TombolIkuti targetId={o.id} masuk={masuk} saatIkuti={() => sembunyikan(o.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}