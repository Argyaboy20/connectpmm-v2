import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { ambilSesi } from "@/lib/sesi";
import { FormBuatPost } from "@/components/app/form-buat-post";

export const metadata = { title: "Buat Post · PMM Connect" };

export default async function Buat() {
  const sesi = await ambilSesi();
  if (!sesi) redirect("/masuk");
  const diblokir = sesi.user.status === "DIBLOKIR";
  const role = sesi.user.role ?? "UMUM";
  const peserta = role === "PESERTA" && !diblokir;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Kembali" className="hover:bg-muted rounded-full p-2">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Buat Post Baru</h1>
      </div>

      {diblokir ? (
        <p role="alert" className="text-destructive rounded-2xl border p-4 text-sm">
          Akunmu sedang diblokir.
        </p>
      ) : (
        <FormBuatPost />
      )}

      {peserta ? (
        <div className="space-y-2">
          <Link
            href="/buat/laporan"
            className="hover:bg-muted flex items-center gap-3 rounded-2xl border p-4 transition-colors"
          >
            <FileText className="size-6" />
            <div className="flex-1">
              <p className="font-semibold">Laporan Kegiatan</p>
              <p className="text-muted-foreground text-xs">
                Laporan resmi kegiatan PMM. Hanya terlihat olehmu dan Koordinator.
              </p>
            </div>
            <ChevronRight className="text-muted-foreground size-5" />
          </Link>
          <Link href="/laporan" className="text-primary block text-sm font-semibold">
            Lihat laporan saya
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <div aria-disabled="true" className="flex items-center gap-3 rounded-2xl border p-4 opacity-60">
            <FileText className="size-6" />
            <div className="flex-1">
              <p className="font-semibold">Laporan Kegiatan</p>
              <p className="text-muted-foreground text-xs">Laporan resmi kegiatan PMM.</p>
            </div>
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-semibold">Khusus Peserta</span>
          </div>
          {role === "KOORDINATOR" && !diblokir && (
            <Link href="/laporan" className="text-primary block text-sm font-semibold">
              Lihat laporan Peserta
            </Link>
          )}
        </div>
      )}
    </div>
  );
}