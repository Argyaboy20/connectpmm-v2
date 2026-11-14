import { BadgeCheck } from "lucide-react";

const GAYA: Record<string, { label: string; kelas: string }> = {
  UMUM: { label: "Umum", kelas: "bg-muted text-muted-foreground" },
  PESERTA: { label: "Peserta", kelas: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  KOORDINATOR: {
    label: "Koordinator",
    kelas: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

export function RoleBadge({ role }: { role: string }) {
  const g = GAYA[role] ?? GAYA.UMUM;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${g.kelas}`}
    >
      {role === "KOORDINATOR" && <BadgeCheck className="size-3" />}
      {g.label}
    </span>
  );
}