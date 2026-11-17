import { Info, Lock, UserCog, type LucideIcon } from "lucide-react";

export type ItemLainnya = {
  kunci: string;
  label: string;
  href: string;
  ikon: LucideIcon;
  perluLogin: boolean;
};

export const MENU_LAINNYA: ItemLainnya[] = [
  { kunci: "akun", label: "Informasi Akun", href: "/akun", ikon: UserCog, perluLogin: true },
  { kunci: "tentang", label: "Tentang Sistem", href: "/tentang", ikon: Info, perluLogin: false },
  { kunci: "privasi", label: "Kebijakan Privasi", href: "/privasi", ikon: Lock, perluLogin: false },
];