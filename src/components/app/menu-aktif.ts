// Satu aturan "menu mana yang menyala", dipakai sidebar dan navbar bawah.
export function menuAktif(
  m: { kunci: string; href: string },
  pathname: string,
  dari: string | null,
  usernameSaya: string | null,
) {
  if (m.href === "/") return pathname === "/";

  const bagian = pathname.split("/").filter(Boolean);
  const profilLain =
    bagian[0] === "profil" &&
    bagian[1] !== undefined &&
    decodeURIComponent(bagian[1]).toLowerCase() !== (usernameSaya ?? "").toLowerCase();

  if (m.kunci === "profil") return bagian[0] === "profil" && !profilLain;
  if (m.kunci === "pencarian") {
    return pathname.startsWith("/pencarian") || (profilLain && dari === "pencarian");
  }
  return pathname.startsWith(m.href);
}