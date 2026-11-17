import { MessageCircle } from "lucide-react";
import { TombolSuka } from "@/components/app/tombol-suka";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { waktuPost } from "@/lib/waktu";
import Link from "next/link";
import { TombolHapus } from "@/components/app/tombol-hapus";
import { TombolBagikan } from "@/components/app/tombol-bagikan";
import { TombolLapor } from "@/components/app/tombol-lapor";

export type GambarPost = { kunci: string; lebar: number | null; tinggi: number | null };

export type DataPost = {
  id: string;
  isi: string;
  tipe: string;
  dibuatPada: Date;
  nama: string;
  username: string | null;
  role: string | null;
  foto?: string | null;
  gambar?: GambarPost[];
  jumlahSuka?: number;
  disukai?: boolean;
  jumlahKomentar?: number;
};

function Galeri({ gambar }: { gambar: GambarPost[] }) {
  if (gambar.length === 1) {
    const g = gambar[0];
    const rasio = g.lebar && g.tinggi ? Math.min(Math.max(g.lebar / g.tinggi, 0.8), 1.91) : 1;
    return (
      <div className="mt-3 overflow-hidden rounded-xl border" style={{ aspectRatio: rasio }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/media/${g.kunci}`}
          alt="Foto post"
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
          key={g.kunci}
          className={gambar.length === 3 && i === 0 ? "col-span-2 aspect-video" : "aspect-square"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/media/${g.kunci}`}
            alt={`Foto ${i + 1}`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function PostCard({
  data,
  masuk = false,
  bolehHapus = false,
  moderasi = false,
  keBeranda = false,
}: {
  data: DataPost;
  masuk?: boolean;
  bolehHapus?: boolean;
  moderasi?: boolean;
  keBeranda?: boolean;
}) {
  return (
    <article className="rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <AvatarInisial nama={data.nama} foto={data.foto} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold">{data.nama}</span>
            <RoleBadge role={data.role ?? "UMUM"} />
            <span className="text-muted-foreground truncate text-sm">@{data.username}</span>
          </div>
          <time dateTime={data.dibuatPada.toISOString()} className="text-muted-foreground text-xs">
            {waktuPost(data.dibuatPada)}
          </time>
        </div>
        {bolehHapus && (
          <TombolHapus
            jenis={data.tipe === "CONNEX" ? "connex" : "post"}
            id={data.id}
            moderasi={moderasi}
            keBeranda={keBeranda}
          />
        )}
      </div>

      {data.gambar && data.gambar.length > 0 && <Galeri gambar={data.gambar} />}

      {data.isi && (
        <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{data.isi}</p>
      )}

      <div className="text-muted-foreground mt-3 flex items-center gap-6 border-t pt-3">
        <TombolSuka
          key={`${data.id}-${data.disukai ? 1 : 0}-${data.jumlahSuka ?? 0}`}
          postId={data.id}
          masuk={masuk}
          awalSuka={data.disukai ?? false}
          awalJumlah={data.jumlahSuka ?? 0}
        />
        <Link
          href={`/post/${data.id}`}
          aria-label="Lihat komentar"
          className="hover:text-foreground flex items-center gap-1.5"
        >
          <MessageCircle className="size-5" />
          {(data.jumlahKomentar ?? 0) > 0 && (
            <span className="text-sm tabular-nums">{data.jumlahKomentar}</span>
          )}
        </Link>
        <TombolBagikan postId={data.id} masuk={masuk} />
        {(!bolehHapus || moderasi) && (
          <span className="ml-auto">
            <TombolLapor jenis="POST" id={data.id} masuk={masuk} />
          </span>
        )}
      </div>
    </article>
  );
}