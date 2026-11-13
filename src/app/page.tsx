export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border shadow-sm">
        <div className="bg-brand-gradient p-6 text-center text-white">
          <h1 className="text-2xl font-bold">PMM Connect</h1>
          <p className="text-sm opacity-90">Tes tema</p>
        </div>
        <div className="p-6">
          <button className="w-full rounded-lg bg-primary py-2 font-semibold text-primary-foreground">
            Tombol utama
          </button>
        </div>
      </div>
    </main>
  );
}