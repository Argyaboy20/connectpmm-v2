import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ImageIcon, MessageCircle } from "lucide-react";
import { db } from "@/db";
import { post, user } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";
import { PostCard } from "@/components/post-card";
import { KomposerConnex } from "@/components/app/komposer-connex";

export const metadata = { title: "Beranda · PMM Connect" };

const TAB = [
  { kunci: "post", label: "Post", ikon: ImageIcon },
  { kunci: "connex", label: "Connex", ikon: MessageCircle },
] as const;

export default async function Beranda({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: param } = await searchParams;
  const tab = param === "connex" ? "connex" : "post";
  const tipe = tab === "connex" ? "CONNEX" : "POST";
  const sesi = await ambilSesi();

  const daftar = await db
    .select({
      id: post.id,
      isi: post.isi,
      tipe: post.tipe,
      dibuatPada: post.dibuatPada,
      nama: user.name,
      username: user.username,
      role: user.role,
    })
    .from(post)
    .innerJoin(user, eq(post.penulisId, user.id))
    .where(and(eq(post.tipe, tipe), isNull(post.dihapusPada)))
    .orderBy(desc(post.dibuatPada))
    .limit(20);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
        {TAB.map(({ kunci, label, ikon: Ikon }) => (
          <Link
            key={kunci}
            href={kunci === "post" ? "/" : `/?tab=${kunci}`}
            scroll={false}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
              tab === kunci ? "bg-brand-gradient text-white" : "hover:bg-muted"
            }`}
          >
            <Ikon className="size-4" />
            {label}
          </Link>
        ))}
      </div>

      {tab === "connex" &&
        (sesi ? (
          <KomposerConnex nama={sesi.user.name} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm">
            <p className="text-muted-foreground">Masuk untuk membagikan ceritamu.</p>
            <div className="flex gap-2">
              <Link href="/masuk" className="rounded-lg border px-4 py-2 font-semibold">
                Masuk
              </Link>
              <Link href="/daftar" className="bg-brand-gradient rounded-lg px-4 py-2 font-semibold text-white">
                Daftar
              </Link>
            </div>
          </div>
        ))}

      {daftar.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
          {tab === "post" ? (
            <ImageIcon className="size-10 opacity-40" />
          ) : (
            <MessageCircle className="size-10 opacity-40" />
          )}
          <p>{tab === "post" ? "Belum ada post foto." : "Belum ada Connex."}</p>
          <p>Jadilah yang pertama berbagi cerita.</p>
        </div>
      ) : (
        daftar.map((d) => <PostCard key={d.id} data={d} />)
      )}
    </div>
  );
}