import { Heart, MessageCircle, Share2 } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { waktuPost } from "@/lib/waktu";

export type DataPost = {
  id: string;
  isi: string;
  tipe: string;
  dibuatPada: Date;
  nama: string;
  username: string | null;
  role: string | null;
};

export function PostCard({ data }: { data: DataPost }) {
  return (
    <article className="rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <AvatarInisial nama={data.nama} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold">{data.nama}</span>
            <RoleBadge role={data.role ?? "UMUM"} />
            <span className="text-muted-foreground truncate text-sm">@{data.username}</span>
          </div>
          <time dateTime={data.dibuatPada.toISOString()} className="text-muted-foreground text-xs">
            {waktuPost(data.dibuatPada)}
          </time>
        </div>
      </div>

      {data.isi && (
        <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{data.isi}</p>
      )}

      <div className="text-muted-foreground/50 mt-3 flex gap-6 border-t pt-3">
        <span title="Segera">
          <Heart className="size-5" />
        </span>
        <span title="Segera">
          <MessageCircle className="size-5" />
        </span>
        <span title="Segera">
          <Share2 className="size-5" />
        </span>
      </div>
    </article>
  );
}