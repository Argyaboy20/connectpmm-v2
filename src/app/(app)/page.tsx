import Link from "next/link";
import { ImageIcon, MessageCircle } from "lucide-react";

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

      <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
        {tab === "post" ? <ImageIcon className="size-10 opacity-40" /> : <MessageCircle className="size-10 opacity-40" />}
        <p>{tab === "post" ? "Belum ada post foto." : "Belum ada Connex."}</p>
        <p>Jadilah yang pertama berbagi cerita.</p>
      </div>
    </div>
  );
}