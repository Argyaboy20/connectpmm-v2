import Link from "next/link";
import { CalendarDays, ClipboardList, MapPin } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { TombolHapusLaporan } from "@/components/app/tombol-hapus-laporan";
import { tanggalKegiatan, waktuPost } from "@/lib/waktu";
import type { DataLaporan } from "@/lib/laporan";

function Galeri({ gambar }: { gambar: DataLaporan["gambar"] }) {
  if (gambar.length === 1) {
    const g = gambar[0];
    const rasio = g.lebar && g.tinggi ? Math.min(Math.max(g.lebar / g.tinggi, 0.8), 1.91) : 1;
    return (
      <div className="mt-3 overflow-hidden rounded-xl border" style={{ aspectRatio: rasio }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/laporan-foto/${g.id}`}
          alt="Foto dokumentasi"
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-xl border">
      {gambar.map((g, i) => (
        <div
          key={g.id}
          className={gambar.length === 3 && i === 0 ? "col-span-2 aspect-video" : "aspect-square"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/laporan-foto/${g.id}`}
            alt={`Foto dokumentasi ${i + 1}`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function ListaLaporan({
  item,
  idSaya,
  koordinator,
  hrefMuat,
}: {
  item: DataLaporan[];
  idSaya: string;
  koordinator: boolean;
  hrefMuat: string | null;
}) {
  if (item.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
        <ClipboardList className="size-10 opacity-40" />
        <p>{koordinator ? "Belum ada laporan dari Peserta." : "Kamu belum membuat laporan."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {item.map((l) => (
        <article key={l.id} className="rounded-2xl border p-4">
          <div className="flex items-start gap-3">
            <AvatarInisial nama={l.nama} foto={l.foto} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate font-semibold">{l.nama}</span>
                <RoleBadge role={l.role ?? "UMUM"} />
                <span className="text-muted-foreground truncate text-sm">@{l.username}</span>
              </div>
              <time dateTime={l.dibuatPada.toISOString()} className="text-muted-foreground text-xs">
                Dikirim {waktuPost(l.dibuatPada)}
              </time>
            </div>
            {(koordinator || l.penulisId === idSaya) && (
              <TombolHapusLaporan id={l.id} moderasi={koordinator && l.penulisId !== idSaya} />
            )}
          </div>

          <span className="bg-muted mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Laporan Kegiatan
          </span>
          <h2 className="mt-2 text-base font-bold [overflow-wrap:anywhere]">{l.judul}</h2>
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" />
              {tanggalKegiatan(l.tanggal)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" />
              <span className="[overflow-wrap:anywhere]">{l.lokasi}</span>
            </span>
          </div>

          {l.gambar.length > 0 && <Galeri gambar={l.gambar} />}

          <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{l.uraian}</p>
        </article>
      ))}

      {hrefMuat && (
        <div className="flex justify-center">
          <Link
            href={hrefMuat}
            scroll={false}
            className="hover:bg-muted rounded-lg border px-5 py-2 text-sm font-semibold"
          >
            Muat lagi
          </Link>
        </div>
      )}
    </div>
  );
}