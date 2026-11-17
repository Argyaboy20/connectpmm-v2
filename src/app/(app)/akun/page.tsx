import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { perguruanTinggi, user } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";
import { FormFoto } from "@/components/app/form-foto";
import { FormNama } from "@/components/app/form-nama";
import { FormUsername } from "@/components/app/form-username";
import { FormPassword } from "@/components/app/form-password";
import { FormPt } from "@/components/app/form-pt";
import { TombolKeluar } from "@/components/app/tombol-keluar";
import { TombolHapusAkun } from "@/components/app/tombol-hapus-akun";
import { RoleBadge } from "@/components/role-badge";

export const metadata = { title: "Informasi Akun · PMM Connect" };

function Baris({ label, nilai, children }: { label: string; nilai?: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-2 border-b py-4 last:border-b-0">
      <div>
        <p className="text-muted-foreground text-xs font-semibold">{label}</p>
        {nilai && <p className="text-[15px] break-words">{nilai}</p>}
      </div>
      {children}
    </div>
  );
}

export default async function Akun() {
  const sesi = await ambilSesi();
  if (!sesi) redirect("/masuk");

  const [u] = await db
    .select({
      nama: user.name,
      username: user.username,
      email: user.email,
      foto: user.image,
      role: user.role,
      status: user.status,
      roleDiminta: user.roleDiminta,
      statusKoordinator: user.statusKoordinator,
      ptPengirim: user.ptPengirim,
      ptPenerima: user.ptPenerima,
    })
    .from(user)
    .where(eq(user.id, sesi.user.id))
    .limit(1);
  if (!u) redirect("/masuk");

  const diblokir = u.status === "DIBLOKIR";
  const peran = u.roleDiminta ?? u.role;
  const daftarPt = (await db.select({ nama: perguruanTinggi.nama }).from(perguruanTinggi).orderBy(asc(perguruanTinggi.nama))).map(
    (p) => p.nama,
  );
  const bolehPt =
    peran === "PESERTA" ||
    (peran === "KOORDINATOR" && (u.statusKoordinator === "PENGIRIM" || u.statusKoordinator === "PENERIMA"));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/profil" aria-label="Kembali ke profil" className="hover:bg-muted rounded-full p-2">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Informasi Akun</h1>
      </div>

      {diblokir && (
        <p role="alert" className="text-destructive rounded-2xl border p-4 text-sm">
          Akunmu sedang diblokir, jadi data tidak bisa diubah.
        </p>
      )}

      <section className="rounded-2xl border p-4">
        <div className="flex items-start gap-4 border-b pb-4">
          {diblokir ? (
            <p className="text-muted-foreground text-sm">Foto profil tidak bisa diubah.</p>
          ) : (
            <FormFoto nama={u.nama} foto={u.foto} ukuran={72} />
          )}
          <div className="pt-1">
            <RoleBadge role={u.role} />
          </div>
        </div>

        <Baris label="Nama Lengkap" nilai={u.nama}>
          {!diblokir && <FormNama awal={u.nama} />}
        </Baris>
        <Baris label="Username" nilai={u.username ? `@${u.username}` : "-"}>
          {!diblokir && u.username && <FormUsername key={u.username} awal={u.username} />}
        </Baris>
        <Baris label="Email" nilai={u.email}>
          <p className="text-muted-foreground text-xs">
            Email belum bisa diubah. Fitur ini dibuka setelah verifikasi email tersedia.
          </p>
        </Baris>
        <Baris label="Password" nilai="••••••••">{!diblokir && <FormPassword />}</Baris>

        {bolehPt && !diblokir && (
          <Baris label={peran === "PESERTA" ? "Asal PT" : "PT"}>
            <FormPt
              key={`${u.ptPengirim}|${u.ptPenerima}`}
              peran={peran as "PESERTA" | "KOORDINATOR"}
              status={u.statusKoordinator === "PENGIRIM" || u.statusKoordinator === "PENERIMA" ? u.statusKoordinator : null}
              ptPengirim={u.ptPengirim ?? ""}
              ptPenerima={u.ptPenerima ?? ""}
              daftarPt={daftarPt}
            />
          </Baris>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-4">
          <TombolHapusAkun />
          <TombolKeluar />
        </div>
      </section>
    </div>
  );
}