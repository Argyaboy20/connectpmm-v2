import { Bell, Home, Mail, PlusCircle, Search, UserCircle, type LucideIcon } from "lucide-react";

export type ItemMenu = {
  kunci: string;
  label: string;
  ikon: LucideIcon;
  href: string;
  siap: boolean;
  perluLogin?: boolean;
};

export const MENU: ItemMenu[] = [
  { kunci: "beranda", label: "Beranda", ikon: Home, href: "/", siap: true },
  { kunci: "pencarian", label: "Pencarian", ikon: Search, href: "/pencarian", siap: false },
  { kunci: "pesan", label: "Pesan", ikon: Mail, href: "/pesan", siap: false },
  { kunci: "notifikasi", label: "Notifikasi", ikon: Bell, href: "/notifikasi", siap: false },
  { kunci: "buat", label: "Buat", ikon: PlusCircle, href: "/buat", siap: true, perluLogin: true },
  { kunci: "profil", label: "Profil", ikon: UserCircle, href: "/profil", siap: false, perluLogin: true },
];