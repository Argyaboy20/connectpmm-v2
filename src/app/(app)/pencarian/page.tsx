import Link from "next/link";
import { Search, UserRound, FileText } from "lucide-react";
import { ambilSesi } from "@/lib/sesi";
import {
  MAKS_HALAMAN,
  MIN_KATA_KUNCI,
  bersihkanKataKunci,
  cariOrang,
  cariPost,
} from "@/lib/pencarian";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { PostCard } from "@/components/post-card";

export const metadata = { title: "Pencarian · PMM Connect" };

const TAB = [
  { kunci: "orang", label: "Orang", ikon: UserRound },
  { kunci: "post", label: "Post", ikon: FileText },
] as const;

// Alamat profil orang lain. Ubah di sini kalau rutenya berbeda.
const hrefProfil = (username: string | null) => `/profil/${username ?? ""}?dari=pencarian`;

export default async function Pencarian({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tab?: string; hal?: string }>;
}) {
  const sp = await searchParams;
  const q = bersihkanKataKunci(sp.q);
  const tab = sp.tab === "post" ? "post" : "orang";
  const hal = Math.min(MAKS_HALAMAN, Math.max(1, parseInt(sp.hal ?? "1", 10) || 1));
  const sesi = await ambilSesi();
  const valid = q.length >= MIN_KATA_KUNCI;

  const hasilOrang = valid && tab === "orang" ? await cariOrang(q, hal) : null;
  const hasilPost = valid && tab === "post" ? await cariPost(q, hal, sesi?.user.id ?? null) : null;
  const adaLagi = (hasilOrang?.adaLagi || hasilPost?.adaLagi) ?? false;
  const kosong = (hasilOrang && hasilOrang.item.length === 0) || (hasilPost && hasilPost.item.length === 0);

  const href = (t: string, h = 1) =>
    `/pencarian?q=${encodeURIComponent(q)}&tab=${t}${h > 1 ? `&hal=${h}` : ""}`;

  return (
    <div className="space-y-4">
      <form action="/pencarian" method="get" role="search" className="flex gap-2">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={50}
            placeholder="Cari orang atau post"
            aria-label="Kata kunci pencarian"
            className="h-10 w-full rounded-lg border bg-transparent pr-3 pl-9 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-brand-gradient h-10 rounded-lg px-4 text-sm font-semibold text-white"
        >
          Cari
        </button>
      </form>

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
        {TAB.map(({ kunci, label, ikon: Ikon }) => (
          <Link
            key={kunci}
            href={href(kunci)}
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

      {!valid && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {q.length === 0
            ? "Ketik nama, username, atau kata dari sebuah post."
            : `Ketik minimal ${MIN_KATA_KUNCI} karakter.`}
        </p>
      )}

      {valid && kosong && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
          <Search className="size-10 opacity-40" />
          <p>Tidak ada hasil untuk “{q}”.</p>
        </div>
      )}

      {hasilOrang?.item.map((o) => (
        <Link
          key={o.id}
          href={hrefProfil(o.username)}
          className="hover:bg-muted flex items-center gap-3 rounded-2xl border p-4 transition-colors"
        >
          <AvatarInisial nama={o.nama} foto={o.foto} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate font-semibold">{o.nama}</span>
              <RoleBadge role={o.role ?? "UMUM"} />
            </div>
            <span className="text-muted-foreground truncate text-sm">@{o.username}</span>
          </div>
        </Link>
      ))}

      {hasilPost?.item.map((d) => (
        <PostCard key={d.id} data={d} masuk={!!sesi} />
      ))}

      {adaLagi && hal < MAKS_HALAMAN && (
        <div className="flex justify-center">
          <Link
            href={href(tab, hal + 1)}
            scroll={false}
            className="rounded-lg border px-5 py-2 text-sm font-semibold hover:bg-muted"
          >
            Muat lagi
          </Link>
        </div>
      )}
    </div>
  );
}