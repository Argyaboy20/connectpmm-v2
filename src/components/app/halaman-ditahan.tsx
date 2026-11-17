import { asc, desc, eq, inArray, isNotNull, and } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import { db } from "@/db";
import { komentar, post, postGambar, user } from "@/db/schema";
import { waktuPost } from "@/lib/waktu";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { AksiTahanan } from "@/components/app/aksi-tahanan";

function Penulis({
  nama,
  username,
  role,
  foto,
  waktu,
}: {
  nama: string;
  username: string | null;
  role: string | null;
  foto: string | null;
  waktu: Date | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <AvatarInisial nama={nama} foto={foto} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-semibold">{nama}</span>
          <RoleBadge role={role ?? "UMUM"} />
          <span className="text-muted-foreground truncate text-sm">@{username}</span>
        </div>
        {waktu && <p className="text-muted-foreground text-xs">Ditahan {waktuPost(waktu)}</p>}
      </div>
    </div>
  );
}

export async function HalamanDitahan() {
  const [daftarPost, daftarKomentar] = await Promise.all([
    db
      .select({
        id: post.id,
        isi: post.isi,
        tipe: post.tipe,
        ditahanPada: post.ditahanPada,
        ditahanAlasan: post.ditahanAlasan,
        nama: user.name,
        username: user.username,
        role: user.role,
        foto: user.image,
      })
      .from(post)
      .innerJoin(user, eq(post.penulisId, user.id))
      .where(and(isNotNull(post.ditahanPada), isNotNull(post.dihapusPada)))
      .orderBy(desc(post.ditahanPada))
      .limit(30),
    db
      .select({
        id: komentar.id,
        isi: komentar.isi,
        ditahanPada: komentar.ditahanPada,
        ditahanAlasan: komentar.ditahanAlasan,
        nama: user.name,
        username: user.username,
        role: user.role,
        foto: user.image,
      })
      .from(komentar)
      .innerJoin(user, eq(komentar.penulisId, user.id))
      .where(and(isNotNull(komentar.ditahanPada), isNotNull(komentar.dihapusPada)))
      .orderBy(desc(komentar.ditahanPada))
      .limit(30),
  ]);

  const gambar = daftarPost.length
    ? await db
        .select({ postId: postGambar.postId, kunci: postGambar.kunci })
        .from(postGambar)
        .where(inArray(postGambar.postId, daftarPost.map((p) => p.id)))
        .orderBy(asc(postGambar.urutan))
    : [];

  if (daftarPost.length === 0 && daftarKomentar.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
        <ShieldAlert className="size-10 opacity-40" />
        <p>Tidak ada konten yang ditahan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Konten di sini disembunyikan dari semua orang. Pulihkan kalau ternyata wajar, atau hapus permanen
        dengan alasan. Menampilkan maksimal 30 terbaru per jenis.
      </p>

      {daftarPost.map((p) => {
        const foto = gambar.filter((g) => g.postId === p.id);
        return (
          <article key={p.id} className="rounded-2xl border p-4">
            <Penulis nama={p.nama} username={p.username} role={p.role} foto={p.foto} waktu={p.ditahanPada} />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {p.tipe === "CONNEX" ? "Connex" : "Post"}
              </span>
              {p.ditahanAlasan && (
                <span className="bg-destructive/10 text-destructive rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {p.ditahanAlasan}
                </span>
              )}
            </div>
            {foto.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-1">
                {foto.map((g) => (
                  <div key={g.kunci} className="aspect-square overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/${g.kunci}`} alt="Foto post" loading="lazy" className="size-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            {p.isi && (
              <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{p.isi}</p>
            )}
            <AksiTahanan jenis="POST" id={p.id} />
          </article>
        );
      })}

      {daftarKomentar.map((k) => (
        <article key={k.id} className="rounded-2xl border p-4">
          <Penulis nama={k.nama} username={k.username} role={k.role} foto={k.foto} waktu={k.ditahanPada} />
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="bg-muted rounded-full px-2.5 py-0.5 text-xs font-semibold">Komentar</span>
            {k.ditahanAlasan && (
              <span className="bg-destructive/10 text-destructive rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {k.ditahanAlasan}
              </span>
            )}
          </div>
          <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{k.isi}</p>
          <AksiTahanan jenis="KOMENTAR" id={k.id} />
        </article>
      ))}
    </div>
  );
}