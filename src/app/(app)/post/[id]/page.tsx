import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { komentar, post, postGambar, suka, user } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";
import { waktuPost } from "@/lib/waktu";
import { PostCard } from "@/components/post-card";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { FormKomentar } from "@/components/app/form-komentar";
import { TombolHapus } from "@/components/app/tombol-hapus";

export const metadata = { title: "Post · PMM Connect" };

export default async function DetailPost({ params }: { params: Promise<{ id: string }> }) {
  const { id: param } = await params;
  const id = z.uuid().safeParse(param);
  if (!id.success) notFound();

  const sesi = await ambilSesi();
  const idSaya = sesi && sesi.user.status !== "DIBLOKIR" ? sesi.user.id : null;
  const koordinator = sesi?.user.role === "KOORDINATOR" && sesi.user.status !== "DIBLOKIR";

  const [p] = await db
    .select({
      id: post.id,
      penulisId: post.penulisId,
      isi: post.isi,
      tipe: post.tipe,
      dibuatPada: post.dibuatPada,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
    })
    .from(post)
    .innerJoin(user, eq(post.penulisId, user.id))
    .where(and(eq(post.id, id.data), isNull(post.dihapusPada)))
    .limit(1);
  if (!p) notFound();

  const [gambar, [hitung], milikku, daftarKomentar] = await Promise.all([
    db
      .select({ kunci: postGambar.kunci, lebar: postGambar.lebar, tinggi: postGambar.tinggi })
      .from(postGambar)
      .where(eq(postGambar.postId, p.id))
      .orderBy(asc(postGambar.urutan)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(suka)
      .where(eq(suka.postId, p.id)),
    sesi
      ? db
          .select({ postId: suka.postId })
          .from(suka)
          .where(and(eq(suka.userId, sesi.user.id), eq(suka.postId, p.id)))
      : Promise.resolve([] as { postId: string }[]),
    db
      .select({
        id: komentar.id,
        penulisId: komentar.penulisId,
        isi: komentar.isi,
        dibuatPada: komentar.dibuatPada,
        nama: user.name,
        username: user.username,
        role: user.role,
        foto: user.image,
      })
      .from(komentar)
      .innerJoin(user, eq(komentar.penulisId, user.id))
      .where(and(eq(komentar.postId, p.id), isNull(komentar.dihapusPada)))
      .orderBy(asc(komentar.dibuatPada)),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Kembali" className="hover:bg-muted rounded-full p-2">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      <PostCard
        masuk={!!sesi}
        bolehHapus={idSaya === p.penulisId || koordinator}
        moderasi={koordinator && idSaya !== p.penulisId}
        keBeranda
        data={{
          ...p,
          gambar,
          jumlahSuka: hitung.n,
          disukai: milikku.length > 0,
          jumlahKomentar: daftarKomentar.length,
        }}
      />

      <section aria-label="Komentar" className="space-y-3">
        <h2 className="font-semibold">Komentar ({daftarKomentar.length})</h2>

        {sesi ? (
          sesi.user.status === "DIBLOKIR" ? (
            <p role="alert" className="text-destructive rounded-2xl border p-4 text-sm">
              Akunmu sedang diblokir.
            </p>
          ) : (
            <FormKomentar postId={p.id} nama={sesi.user.name} foto={sesi.user.image ?? null} />
          )
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm">
            <p className="text-muted-foreground">Masuk untuk ikut berkomentar.</p>
            <div className="flex gap-2">
              <Link href="/masuk" className="rounded-lg border px-4 py-2 font-semibold">
                Masuk
              </Link>
              <Link href="/daftar" className="bg-brand-gradient rounded-lg px-4 py-2 font-semibold text-white">
                Daftar
              </Link>
            </div>
          </div>
        )}

        {daftarKomentar.length === 0 ? (
          <p className="text-muted-foreground rounded-2xl border border-dashed py-8 text-center text-sm">
            Belum ada komentar.
          </p>
        ) : (
          daftarKomentar.map((k) => (
            <article key={k.id} className="flex gap-3 rounded-2xl border p-4">
              <AvatarInisial nama={k.nama} foto={k.foto} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate font-semibold">{k.nama}</span>
                  <RoleBadge role={k.role ?? "UMUM"} />
                  <span className="text-muted-foreground truncate text-sm">@{k.username}</span>
                </div>
                <time dateTime={k.dibuatPada.toISOString()} className="text-muted-foreground text-xs">
                  {waktuPost(k.dibuatPada)}
                </time>
                <p className="mt-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{k.isi}</p>
              </div>
              {(idSaya === k.penulisId || idSaya === p.penulisId || koordinator) && (
                <TombolHapus
                  jenis="komentar"
                  id={k.id}
                  moderasi={koordinator && idSaya !== k.penulisId && idSaya !== p.penulisId}
                />
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}