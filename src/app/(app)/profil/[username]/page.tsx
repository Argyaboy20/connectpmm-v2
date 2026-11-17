import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq, isNull } from "drizzle-orm";
import { ImageIcon, MessageCircle } from "lucide-react";
import { db } from "@/db";
import { post, user } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";
import { ambilFeed } from "@/lib/feed";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { DaftarFeed } from "@/components/app/daftar-feed";
import { FormBio } from "@/components/app/form-bio";
import { FormUsername } from "@/components/app/form-username";
import { FormFoto } from "@/components/app/form-foto";
import { TombolKeluar } from "@/components/app/tombol-keluar";
import { TombolIkuti } from "@/components/app/tombol-ikuti";
import { DaftarSaran } from "@/components/app/daftar-saran";
import { ambilSaran, infoIkuti } from "@/lib/saran";

export const metadata = { title: "Profil · PMM Connect" };

const TAB = [
  { kunci: "post", label: "Post", ikon: ImageIcon },
  { kunci: "connex", label: "Connex", ikon: MessageCircle },
] as const;

export default async function HalamanProfil({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; dari?: string }>;
}) {
  const { username } = await params;
  const { tab: param, dari: dariParam } = await searchParams;
  const dari = dariParam === "pencarian" ? "dari=pencarian" : "";
  const tab = param === "connex" ? "connex" : "post";

  const [profil] = await db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      role: user.role,
      bio: user.bio,
      foto: user.image,
    })
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
    .limit(1);
  if (!profil) notFound();

  const sesi = await ambilSesi();
  const milikSaya = sesi?.user.id === profil.id;
  const idPenghapus = sesi && sesi.user.status !== "DIBLOKIR" ? sesi.user.id : null;
  const koordinator = sesi?.user.role === "KOORDINATOR" && sesi.user.status !== "DIBLOKIR";

  const [{ n: jumlahPost }] = await db
    .select({ n: count() })
    .from(post)
    .where(and(eq(post.penulisId, profil.id), isNull(post.dihapusPada)));

  const feed = await ambilFeed({
    tipe: tab === "connex" ? "CONNEX" : "POST",
    idSaya: sesi?.user.id ?? null,
    penulisId: profil.id,
  });

  const alamat = `/profil/${profil.username}`;
  const info = await infoIkuti(profil.id, sesi?.user.id ?? null);
  const saran = milikSaya && sesi ? await ambilSaran(sesi.user.id, 10) : [];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          {milikSaya ? (
            <FormFoto nama={profil.nama} foto={profil.foto} ukuran={64} />
          ) : (
            <AvatarInisial nama={profil.nama} foto={profil.foto} ukuran={64} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="truncate text-lg font-bold">{profil.nama}</h1>
              <RoleBadge role={profil.role} />
            </div>
            <p className="text-muted-foreground text-sm">@{profil.username}</p>
          </div>
          {!milikSaya && (
            <TombolIkuti
              key={`${profil.id}:${info.sayaMengikuti}`}
              targetId={profil.id}
              masuk={!!sesi}
              awal={info.sayaMengikuti}
            />
          )}
        </div>

        {profil.bio && (
          <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {profil.bio}
          </p>
        )}

       <p className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 text-sm">
          <span>
            <span className="text-foreground font-semibold tabular-nums">{jumlahPost}</span> post
          </span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">{info.pengikut}</span> pengikut
          </span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">{info.mengikuti}</span> mengikuti
          </span>
        </p>

        {milikSaya && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <FormUsername key={profil.username} awal={profil.username ?? ""} />
            <FormBio awal={profil.bio ?? ""} />
            <div className="ml-auto">
              <TombolKeluar />
            </div>
          </div>
        )}
      </section>

      {milikSaya && <DaftarSaran items={saran} masuk tata="baris" />}

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
        {TAB.map(({ kunci, label, ikon: Ikon }) => (
          <Link
            key={kunci}
            href={
              kunci === "post"
                ? dari ? `${alamat}?${dari}` : alamat
                : `${alamat}?${dari ? `${dari}&` : ""}tab=${kunci}`
            }
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

      <DaftarFeed
        key={`${profil.id}:${tab}:${feed.item[0]?.id ?? "kosong"}:${profil.foto ?? ""}`}
        tab={tab}
        awal={feed.item}
        kursorAwal={feed.kursorBerikut}
        masuk={!!sesi}
        idSaya={idPenghapus}
        koordinator={koordinator}
        penulisId={profil.id}
      />
    </div>
  );
}