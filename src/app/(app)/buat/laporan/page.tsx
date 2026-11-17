import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ambilPelaku } from "@/lib/pelaku";
import { hariIniWIB } from "@/lib/waktu";
import { FormLaporan } from "@/components/app/form-laporan";

export const metadata = { title: "Buat Laporan · PMM Connect" };

export default async function BuatLaporan() {
  const pelaku = await ambilPelaku();
  if (!pelaku) redirect("/masuk");
  if (pelaku.role !== "PESERTA") redirect("/buat");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/buat" aria-label="Kembali" className="hover:bg-muted rounded-full p-2">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Laporan Kegiatan</h1>
      </div>

      {pelaku.status === "DIBLOKIR" ? (
        <p role="alert" className="text-destructive rounded-2xl border p-4 text-sm">
          Akunmu sedang diblokir.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Laporan hanya bisa dilihat olehmu dan Koordinator. Laporan tidak tampil di Beranda.
          </p>
          <FormLaporan maks={hariIniWIB()} />
        </>
      )}
    </div>
  );
}