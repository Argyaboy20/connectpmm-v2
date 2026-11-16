import Link from "next/link";
import { ImageIcon, MessageCircle } from "lucide-react";
import { ambilSesi } from "@/lib/sesi";
import { ambilFeed } from "@/lib/feed";
import { KomposerConnex } from "@/components/app/komposer-connex";
import { DaftarFeed } from "@/components/app/daftar-feed";

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
  const sesi = await ambilSesi();

  const feed = await ambilFeed({
    tipe: tab === "connex" ? "CONNEX" : "POST",
    idSaya: sesi?.user.id ?? null,
  });
  const idPenghapus = sesi && sesi.user.status !== "DIBLOKIR" ? sesi.user.id : null;
  const koordinator = sesi?.user.role === "KOORDINATOR" && sesi.user.status !== "DIBLOKIR";

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
          <KomposerConnex nama={sesi.user.name} foto={sesi.user.image ?? null} />
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

      <DaftarFeed
        key={`${tab}:${feed.item[0]?.id ?? "kosong"}:${sesi?.user.image ?? ""}`}
        tab={tab}
        awal={feed.item}
        kursorAwal={feed.kursorBerikut}
        masuk={!!sesi}
        idSaya={idPenghapus}
        koordinator={koordinator}
      />
    </div>
  );
}