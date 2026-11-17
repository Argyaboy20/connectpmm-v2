import { Bell, Home, Mail, PlusCircle, Search, ShieldCheck, UserCircle, type LucideIcon } from "lucide-react";

export type ItemMenu = {
  kunci: string;
  label: string;
  ikon: LucideIcon;
  href: string;
  siap: boolean;
  perluLogin?: boolean;
  hanyaKoordinator?: boolean;
};

export const MENU: ItemMenu[] = [
  { kunci: "beranda", label: "Beranda", ikon: Home, href: "/", siap: true },
  { kunci: "pencarian", label: "Pencarian", ikon: Search, href: "/pencarian", siap: true },
  { kunci: "pesan", label: "Pesan", ikon: Mail, href: "/pesan", siap: true, perluLogin: true },
  { kunci: "notifikasi", label: "Notifikasi", ikon: Bell, href: "/notifikasi", siap: true, perluLogin: true },
  { kunci: "buat", label: "Buat", ikon: PlusCircle, href: "/buat", siap: true, perluLogin: true },
  { kunci: "profil", label: "Profil", ikon: UserCircle, href: "/profil", siap: true, perluLogin: true },
  { kunci: "moderasi", label: "Moderasi", ikon: ShieldCheck, href: "/moderasi", siap: true, perluLogin: true, hanyaKoordinator: true },
];