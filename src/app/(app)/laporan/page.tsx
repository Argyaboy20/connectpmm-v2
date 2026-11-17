import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { ambilPelaku } from "@/lib/pelaku";
import { daftarLaporan } from "@/lib/laporan";
import { MAKS_HALAMAN } from "@/lib/pencarian";
import { ListaLaporan } from "@/components/app/lista-laporan";

export const metadata = { title: "Laporan Kegiatan · PMM Connect" };

export default async function Laporan({
  searchParams,
}: {
  searchParams: Promise<{ hal?: string }>;
}) {
  const pelaku = await ambilPelaku();
  if (!pelaku) redirect("/masuk");
  const koordinator = pelaku.role === "KOORDINATOR";
  if (pelaku.status === "DIBLOKIR" || (!koordinator && pelaku.role !== "PESERTA")) redirect("/");

  const sp = await searchParams;
  const hal = Math.min(MAKS_HALAMAN, Math.max(1, parseInt(sp.hal ?? "1", 10) || 1));
  const h = await daftarLaporan(pelaku, hal);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{koordinator ? "Laporan Kegiatan" : "Laporan Saya"}</h1>
        {!koordinator && (
          <Link
            href="/buat/laporan"
            className="bg-brand-gradient inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <Plus className="size-4" />
            Buat laporan
          </Link>
        )}
      </div>

      <ListaLaporan
        item={h.item}
        idSaya={pelaku.id}
        koordinator={koordinator}
        hrefMuat={h.adaLagi && hal < MAKS_HALAMAN ? `/laporan?hal=${hal + 1}` : null}
      />
    </div>
  );
}