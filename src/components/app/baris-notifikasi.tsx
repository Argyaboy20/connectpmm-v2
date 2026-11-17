"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AvatarInisial } from "@/components/avatar-inisial";
import { tandaiDibaca } from "@/server/notifikasi";

export type DataNotifikasi = {
  id: string;
  postId: string | null;
  aktorUsername: string | null;
  tipe: string;
  aktorNama: string;
  aktorFoto: string | null;
  cuplikan: string | null;
  judulLaporan: string | null;
  waktu: string;
  belum: boolean;
};

function tujuan(d: DataNotifikasi) {
  switch (d.tipe) {
    case "IKUTI":
      return d.aktorUsername ? `/profil/${d.aktorUsername}` : "/";
    case "LAPORAN_BARU":
      return "/moderasi?tab=laporan";
    case "LAPORAN_DISETUJUI":
    case "LAPORAN_DITOLAK":
      return "/laporan";
    default:
      return `/post/${d.postId}`;
  }
}

function teks(d: DataNotifikasi) {
  const judul = d.judulLaporan ? `: “${d.judulLaporan}”` : "";
  switch (d.tipe) {
    case "SUKA":
      return "menyukai post-mu";
    case "IKUTI":
      return "mulai mengikutimu";
    case "LAPORAN_BARU":
      return `mengirim laporan${judul}`;
    case "LAPORAN_DISETUJUI":
      return `menyetujui laporanmu${judul}`;
    case "LAPORAN_DITOLAK":
      return `menolak laporanmu${judul}`;
    default:
      return `mengomentari: “${d.cuplikan ?? ""}”`;
  }
}

export function BarisNotifikasi({ data }: { data: DataNotifikasi }) {
  const router = useRouter();
  const [proses, mulai] = useTransition();

  function buka() {
    mulai(async () => {
      if (data.belum) {
        await tandaiDibaca(data.id);
        window.dispatchEvent(new Event("notifikasi-berubah"));
      }
      router.push(tujuan(data));
    });
  }

  return (
    <button
      type="button"
      onClick={buka}
      disabled={proses}
      className="hover:bg-muted flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-60"
    >
      <AvatarInisial nama={data.aktorNama} foto={data.aktorFoto} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug break-words">
          <span className="font-semibold">{data.aktorNama}</span> {teks(data)}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{data.waktu}</p>
      </div>
      {data.belum && <span aria-label="Belum dibaca" className="bg-primary mt-2 size-2.5 shrink-0 rounded-full" />}
    </button>
  );
}