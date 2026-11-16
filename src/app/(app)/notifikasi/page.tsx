import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { ambilSesi } from "@/lib/sesi";
import { daftarNotifikasi } from "@/lib/notifikasi";
import { MAKS_HALAMAN } from "@/lib/pencarian";
import { waktuPost } from "@/lib/waktu";
import { BarisNotifikasi } from "@/components/app/baris-notifikasi";
import { TombolSemuaDibaca } from "@/components/app/tombol-semua-dibaca";

export const metadata = { title: "Notifikasi · PMM Connect" };

export default async function Notifikasi({
  searchParams,
}: {
  searchParams: Promise<{ hal?: string }>;
}) {
  const sesi = await ambilSesi();
  if (!sesi) redirect("/masuk");

  const sp = await searchParams;
  const hal = Math.min(MAKS_HALAMAN, Math.max(1, parseInt(sp.hal ?? "1", 10) || 1));
  const { item, adaLagi } = await daftarNotifikasi(sesi.user.id, hal);
  const adaBelumDibaca = item.some((n) => !n.dibacaPada);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Notifikasi</h1>
        {adaBelumDibaca && <TombolSemuaDibaca />}
      </div>

      {item.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
          <Bell className="size-10 opacity-40" />
          <p>Belum ada notifikasi.</p>
        </div>
      ) : (
        item.map((n) => (
          <BarisNotifikasi
            key={n.id}
            data={{
              id: n.id,
              postId: n.postId,
              tipe: n.tipe,
              aktorNama: n.aktorNama,
              aktorFoto: n.aktorFoto,
              cuplikan:
                n.isiKomentar && n.isiKomentar.length > 80
                  ? `${n.isiKomentar.slice(0, 80)}…`
                  : n.isiKomentar,
              waktu: waktuPost(n.dibuatPada),
              belum: !n.dibacaPada,
            }}
          />
        ))
      )}

      {adaLagi && hal < MAKS_HALAMAN && (
        <div className="flex justify-center">
          <Link
            href={`/notifikasi?hal=${hal + 1}`}
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