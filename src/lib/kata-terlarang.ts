// Daftar pola untuk penahanan otomatis. Teks dinormalisasi dulu (huruf kecil, angka pengganti huruf,
// huruf berulang dirapikan), jadi tulis pola tanpa huruf ganda: "budha", bukan "buddha".
// Sengaja sempit supaya salah tahan jarang terjadi. Kasus abu-abu ditangkap lewat tombol Laporkan.

const LEET: Record<string, string> = {
  "4": "a",
  "3": "e",
  "0": "o",
  "1": "i",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

function normal(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[43015 7@$]/g, (c) => LEET[c] ?? c)
    .replace(/(.)\1+/g, "$1");
}

const POLA: { kategori: string; re: RegExp }[] = [
  {
    kategori: "makian kasar",
    re: /\b(kontol|memek|ngentot|jancok|jancuk|jancik|bangsat|bajingan|keparat|pukimak)\b/,
  },
  {
    kategori: "makian kasar",
    re: /\b(dasar|kau|kamu|lu|lo|loe)\s+(anjing|babi|monyet|tolol|goblok)\b|\banjing\s+(lu|lo|loe|kau|kamu)\b/,
  },
  {
    kategori: "ujaran kebencian",
    re: /\b(cina|china|tionghoa|pribumi|kafir|papua|jawa|batak|madura|arab|yahudi|kristen|katolik|muslim|islam|hindu|budha|ahmadiyah|syiah)\s+(babi|anjing|bangsat|monyet|biadab|sampah)\b/,
  },
  {
    kategori: "ajakan kekerasan",
    re: /\b(bunuh|habisi|musnahkan|bakar|ganyang|usir)\s+(semua\s+|para\s+|orang\s+)*(cina|tionghoa|kristen|katolik|muslim|islam|hindu|budha|yahudi|papua|jawa|batak|madura|ahmadiyah|syiah|kafir|pendatang)\b/,
  },
  {
    kategori: "ancaman",
    re: /\b(gue|gw|aku|saya|ku)\s+(akan\s+|mau\s+|bakal\s+)?(bunuh|habisi|hajar)\s+(lu|lo|loe|kau|kamu|dia)\b/,
  },
];

// Kata makian yang ditulis dipisah-pisah ("k o n t o l"). Hanya kata yang sangat khas.
const TANPA_SPASI = /(kontol|memek|ngentot|jancok|jancuk|pukimak)/;

export type HasilPeriksa = { terlarang: false } | { terlarang: true; alasan: string };

export function periksaTeks(teks: string): HasilPeriksa {
  if (!teks) return { terlarang: false };
  const n = normal(teks);
  const kategori = new Set<string>();
  for (const p of POLA) if (p.re.test(n)) kategori.add(p.kategori);
  if (kategori.size === 0 && TANPA_SPASI.test(n.replace(/[^a-z]/g, ""))) kategori.add("makian kasar");
  if (kategori.size === 0) return { terlarang: false };
  return { terlarang: true, alasan: `Otomatis: ${[...kategori].join(", ")}` };
}