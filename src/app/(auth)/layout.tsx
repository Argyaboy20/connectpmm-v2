import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="bg-brand-gradient hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Image src="/logo-putih.png" alt="PMM Connect" width={44} height={44} priority />
          <span className="text-xl font-bold">PMM Connect</span>
        </div>
        <div>
          <h2 className="text-4xl leading-tight font-bold">
            Berbagi cerita dan terhubung dengan teman-temanmu.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Foto, tulisan, dan kegiatanmu, semua di satu tempat.
          </p>
        </div>
        <p className="text-sm text-white/60">© PMM Connect</p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="bg-brand-gradient flex items-center justify-center gap-3 p-5 text-white lg:hidden">
          <Image src="/logo-putih.png" alt="PMM Connect" width={36} height={36} priority />
          <span className="text-lg font-bold">PMM Connect</span>
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}