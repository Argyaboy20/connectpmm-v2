import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, ScrollText, Search, UserCheck, Users } from "lucide-react";
import { and, asc, desc, eq, ilike, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { waktuLengkap } from "@/lib/waktu";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { AksiVerifikasi } from "@/components/app/aksi-verifikasi";
import { AksiBlokir } from "@/components/app/aksi-blokir";
import { DaftarLog } from "@/components/app/daftar-log";
import { ambilLog } from "@/lib/log";
import { daftarLaporan } from "@/lib/laporan";
import { MAKS_HALAMAN } from "@/lib/pencarian";
import { ListaLaporan } from "@/components/app/lista-laporan";

export const metadata = { title: "Moderasi · PMM Connect" };

const TAB = [
  { kunci: "verifikasi", label: "Verifikasi", ikon: UserCheck },
  { kunci: "pengguna", label: "Pengguna", ikon: Users },
  { kunci: "laporan", label: "Laporan", ikon: ClipboardList },
  { kunci: "log", label: "Log", ikon: ScrollText },
] as const;

async function DaftarVerifikasi() {
  const pemohon = await db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      foto: user.image,
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
      <p className="text-muted-foreground text-sm">Verifikasi pendaftaran ({pemohon.length})</p>

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
                <AvatarInisial nama={p.nama} foto={p.foto} />
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

async function DaftarPengguna({ q, idSaya }: { q: string; idSaya: string }) {
  const pola = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const daftar = await db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      foto: user.image,
      email: user.email,
      role: user.role,
      status: user.status,
    })
    .from(user)
    .where(
      q
        ? or(ilike(user.name, pola), ilike(user.username, pola), ilike(user.email, pola))
        : undefined,
    )
    .orderBy(desc(user.createdAt))
    .limit(20);

  return (
    <div className="space-y-4">
      <form action="/moderasi" method="get" className="flex gap-2">
        <input type="hidden" name="tab" value="pengguna" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={50}
          placeholder="Cari nama, username, atau email"
          aria-label="Cari pengguna"
          className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        >
          <Search className="size-4" />
          Cari
        </button>
      </form>

      <p className="text-muted-foreground text-xs">
        {q ? `Hasil untuk “${q}”` : "Akun terbaru"} · maksimal 20 akun, gunakan pencarian untuk mempersempit.
      </p>

      {daftar.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed py-12 text-center text-sm">
          Tidak ada akun yang cocok.
        </p>
      ) : (
        daftar.map((p) => (
          <article key={p.id} className="flex items-start gap-3 rounded-2xl border p-4">
            <AvatarInisial nama={p.nama} foto={p.foto} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate font-semibold">{p.nama}</span>
                <RoleBadge role={p.role} />
                {p.status === "DIBLOKIR" && (
                  <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-semibold">
                    Diblokir
                  </span>
                )}
              </div>
              <p className="text-muted-foreground truncate text-sm">@{p.username}</p>
              <p className="text-muted-foreground truncate text-xs">{p.email}</p>
            </div>
            {p.id === idSaya ? (
              <span className="text-muted-foreground shrink-0 self-start py-1.5 text-xs">Kamu</span>
            ) : p.status === "DIBLOKIR" || p.role !== "KOORDINATOR" ? (
              <AksiBlokir id={p.id} nama={p.nama} diblokir={p.status === "DIBLOKIR"} />
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}

async function HalamanLog() {
  const log = await ambilLog();
  return <DaftarLog awal={log.item} kursorAwal={log.kursorBerikut} />;
}

async function HalamanLaporan({ idSaya, hal }: { idSaya: string; hal: number }) {
  const h = await daftarLaporan({ id: idSaya, role: "KOORDINATOR" }, hal);
  return (
    <ListaLaporan
      item={h.item}
      idSaya={idSaya}
      koordinator
      hrefMuat={h.adaLagi && hal < MAKS_HALAMAN ? `/moderasi?tab=laporan&hal=${hal + 1}` : null}
    />
  );
}

export default async function Moderasi({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; hal?: string }>;
}) {
  const pelaku = await ambilPelaku();
  if (!pelaku) redirect("/masuk");
  if (pelaku.role !== "KOORDINATOR" || pelaku.status === "DIBLOKIR") redirect("/");

  const param = await searchParams;
  const tab =
    param.tab === "pengguna"
      ? "pengguna"
      : param.tab === "log"
        ? "log"
        : param.tab === "laporan"
          ? "laporan"
          : "verifikasi";
  const hal = Math.min(MAKS_HALAMAN, Math.max(1, parseInt(param.hal ?? "1", 10) || 1));
  const q = (param.q ?? "").trim().slice(0, 50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Moderasi</h1>

      <div className="grid grid-cols-4 overflow-hidden rounded-xl border">
        {TAB.map(({ kunci, label, ikon: Ikon }) => (
          <Link
            key={kunci}
            href={kunci === "verifikasi" ? "/moderasi" : `/moderasi?tab=${kunci}`}
            className={`flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors sm:gap-2 sm:text-sm ${
              tab === kunci ? "bg-brand-gradient text-white" : "hover:bg-muted"
            }`}
          >
            <Ikon className="size-4" />
            {label}
          </Link>
        ))}
      </div>

      {tab === "verifikasi" ? (
        <DaftarVerifikasi />
      ) : tab === "pengguna" ? (
        <DaftarPengguna q={q} idSaya={pelaku.id} />
      ) : tab === "laporan" ? (
        <HalamanLaporan idSaya={pelaku.id} hal={hal} />
      ) : (
        <HalamanLog />
      )}
    </div>
  );
}