import { redirect } from "next/navigation";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { waktuLengkap } from "@/lib/waktu";
import { AvatarInisial } from "@/components/avatar-inisial";
import { AksiVerifikasi } from "@/components/app/aksi-verifikasi";

export const metadata = { title: "Moderasi · PMM Connect" };

export default async function Moderasi() {
  const pelaku = await ambilPelaku();
  if (!pelaku) redirect("/masuk");
  if (pelaku.role !== "KOORDINATOR" || pelaku.status === "DIBLOKIR") redirect("/");

  const pemohon = await db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      email: user.email,
      roleDiminta: user.roleDiminta,
      nim: user.nim,
      nidn: user.nidn,
      statusKoordinator: user.statusKoordinator,
      ptPengirim: user.ptPengirim,
      ptPenerima: user.ptPenerima,
      daftarPada: user.createdAt,
    })
    .from(user)
    .where(and(isNotNull(user.roleDiminta), eq(user.status, "AKTIF")))
    .orderBy(asc(user.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Moderasi</h1>
        <p className="text-muted-foreground text-sm">Verifikasi pendaftaran ({pemohon.length})</p>
      </div>

      {pemohon.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed py-12 text-center text-sm">
          Tidak ada pendaftaran yang menunggu verifikasi.
        </p>
      ) : (
        pemohon.map((p) => {
          const peran = p.roleDiminta === "KOORDINATOR" ? "KOORDINATOR" : "PESERTA";
          const rincian: [string, string][] = [];
          if (p.nim) rincian.push(["NIM", p.nim]);
          if (p.nidn) rincian.push(["NIDN", p.nidn]);
          if (p.statusKoordinator) {
            rincian.push(["Status", p.statusKoordinator === "PENGIRIM" ? "Pengirim" : "Penerima"]);
          }
          if (p.ptPengirim) rincian.push(["PT Pengirim", p.ptPengirim]);
          if (p.ptPenerima) rincian.push(["PT Penerima", p.ptPenerima]);

          return (
            <article key={p.id} className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-start gap-3">
                <AvatarInisial nama={p.nama} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate font-semibold">{p.nama}</span>
                    <span className="text-muted-foreground truncate text-sm">@{p.username}</span>
                  </div>
                  <p className="text-muted-foreground truncate text-xs">{p.email}</p>
                  <p className="text-muted-foreground text-xs">Mendaftar {waktuLengkap(p.daftarPada)}</p>
                </div>
                <span className="bg-muted shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
                  {peran === "KOORDINATOR" ? "Koordinator" : "Peserta"}
                </span>
              </div>

              {rincian.length > 0 && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {rincian.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <AksiVerifikasi id={p.id} nama={p.nama} roleDiminta={peran} />
            </article>
          );
        })
      )}
    </div>
  );
}