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

export function waktuJam(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

export function waktuTanggal(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function waktuRingkas(d: Date) {
  return waktuRelatif(d) ?? waktuTanggal(d);
}

export function hariIniWIB() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// "2026-11-14" menjadi "14 November 2026".
export function tanggalKegiatan(s: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${s}T00:00:00Z`));
}