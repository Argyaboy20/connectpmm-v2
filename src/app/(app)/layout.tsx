import { ambilSesi } from "@/lib/sesi";
import type { Pengguna } from "@/lib/pengguna";
import { Sidebar } from "@/components/app/sidebar";
import { MenuBawah } from "@/components/app/menu-bawah";
import { BarAtasHp } from "@/components/app/bar-atas-hp";
import { PanelKanan } from "@/components/app/panel-kanan";
import { BannerPenolakan } from "@/components/app/banner-penolakan";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesi = await ambilSesi();
  const u = sesi?.user;
  const pengguna: Pengguna | null = u
    ? {
        nama: u.name,
        username: u.username ?? null,
        role: u.role ?? "UMUM",
        roleDiminta: u.roleDiminta ?? null,
        roleDitolak: u.roleDitolak ?? null,
        alasanPenolakan: u.alasanPenolakan ?? null,
      }
    : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar pengguna={pengguna} />
      <div className="flex min-w-0 flex-1 justify-center">
        <main className="w-full max-w-[600px] px-4 pb-24 lg:pb-8">
          <BarAtasHp pengguna={pengguna} />
          {pengguna?.roleDiminta && (
            <div
              role="status"
              className="border-primary/30 bg-primary/10 mb-4 rounded-xl border px-4 py-3 text-sm"
            >
              Pendaftaranmu sebagai{" "}
              <strong>{pengguna.roleDiminta === "KOORDINATOR" ? "Koordinator" : "Peserta"}</strong>{" "}
              sedang diverifikasi. Sementara ini kamu masuk sebagai Umum.
            </div>
          )}
          {!pengguna?.roleDiminta && pengguna?.alasanPenolakan && (
            <BannerPenolakan role={pengguna.roleDitolak ?? null} alasan={pengguna.alasanPenolakan} />
          )}
          {children}
        </main>
        <PanelKanan pengguna={pengguna} />
      </div>
      <MenuBawah pengguna={pengguna} />
    </div>
  );
}