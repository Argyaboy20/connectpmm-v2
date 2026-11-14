const WIB = "Asia/Jakarta";

export function waktuLengkap(d: Date) {
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return `${tanggal}, ${jam} WIB`;
}

function waktuRelatif(d: Date, sekarang = new Date()) {
  const detik = Math.floor((sekarang.getTime() - d.getTime()) / 1000);
  if (detik < 60) return "baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return null;
}

export function waktuPost(d: Date) {
  const relatif = waktuRelatif(d);
  return relatif ? `${relatif} · ${waktuLengkap(d)}` : waktuLengkap(d);
}