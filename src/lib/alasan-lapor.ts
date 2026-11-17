export const ALASAN_LAPOR = [
  { kunci: "SARA", label: "SARA / ujaran kebencian" },
  { kunci: "PELECEHAN", label: "Menjelekkan / pelecehan" },
  { kunci: "KEKERASAN", label: "Kekerasan / ancaman" },
  { kunci: "SPAM", label: "Spam" },
  { kunci: "LAINNYA", label: "Lainnya" },
] as const;

// Jumlah pelapor berbeda yang membuat konten otomatis ditahan.
export const AMBANG_LAPOR = 3;
export const BATAS_LAPOR_PER_JAM = 20;