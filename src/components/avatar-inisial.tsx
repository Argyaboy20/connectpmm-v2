const WARNA = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-fuchsia-500",
];

export function AvatarInisial({ nama, ukuran = 40 }: { nama: string; ukuran?: number }) {
  const kata = nama.trim().split(/\s+/);
  const inisial = ((kata[0]?.[0] ?? "") + (kata[1]?.[0] ?? "")).toUpperCase() || "?";
  let hash = 0;
  for (const c of nama) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${WARNA[hash % WARNA.length]}`}
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.38 }}
    >
      {inisial}
    </div>
  );
}