"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormMasuk() {
  const router = useRouter();
  const [akun, setAkun] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesanError, setPesanError] = useState("");
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesanError("");
    setLoading(true);
    const nilai = akun.trim();
    const { error } = nilai.includes("@")
      ? await authClient.signIn.email({ email: nilai, password })
      : await authClient.signIn.username({ username: nilai, password });
    setLoading(false);
    if (error) {
      setPesanError("Email/username atau password salah.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={kirim} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Masuk</h1>
        <p className="text-muted-foreground text-sm">Masuk ke akun PMM Connect kamu.</p>
      </div>

      {pesanError && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
          {pesanError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="akun">Email atau username</Label>
        <Input
          id="akun"
          autoComplete="username"
          required
          value={akun}
          onChange={(e) => setAkun(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={lihat ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setLihat(!lihat)}
            aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
          >
            {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="bg-brand-gradient h-10 w-full text-white">
        {loading && <Loader2 className="size-4 animate-spin" />}
        Masuk
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-primary font-semibold hover:underline">
          Daftar di sini
        </Link>
      </p>
    </form>
  );
}