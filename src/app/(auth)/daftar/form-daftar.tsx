"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "PESERTA" | "KOORDINATOR" | "UMUM";
type StatusKoordinator = "PENGIRIM" | "PENERIMA";

const DAFTAR_ROLE: { nilai: Role; label: string }[] = [
  { nilai: "PESERTA", label: "Peserta" },
  { nilai: "KOORDINATOR", label: "Koordinator" },
  { nilai: "UMUM", label: "Umum" },
];

function buatUsername(nama: string) {
  const dasar =
    nama
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20) || "user";
  const acak = Math.random().toString(36).slice(2, 6);
  return `${dasar}_${acak}`;
}

function pesanDariError(error: { code?: string; message?: string }) {
  if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
    return "Email ini sudah terdaftar. Coba masuk.";
  }
  return error.message || "Pendaftaran gagal. Coba lagi.";
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function FormDaftar({ daftarPt }: { daftarPt: string[] }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("PESERTA");
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [ptPengirim, setPtPengirim] = useState("");
  const [ptPenerima, setPtPenerima] = useState("");
  const [status, setStatus] = useState<StatusKoordinator | "">("");
  const [ptKoordinator, setPtKoordinator] = useState("");
  const [nim, setNim] = useState("");
  const [nidn, setNidn] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [pesanError, setPesanError] = useState("");
  const [loading, setLoading] = useState(false);

  const duaLangkah = role !== "UMUM";
  const tampilAkun = !duaLangkah || langkah === 2;
  const indeksRole = DAFTAR_ROLE.findIndex((r) => r.nilai === role);

  const aturan = [
    { ok: password.length >= 8, teks: "Minimal 8 karakter" },
    { ok: /[A-Z]/.test(password), teks: "Huruf kapital" },
    { ok: /[a-z]/.test(password), teks: "Huruf kecil" },
    { ok: /[0-9]/.test(password), teks: "Angka" },
  ];
  const passwordOk = aturan.every((a) => a.ok);

  function gantiRole(r: Role) {
    setRole(r);
    setLangkah(1);
    setPesanError("");
  }

  function cekAsalPt() {
    if (role === "PESERTA") {
      if (!ptPengirim.trim() || !ptPenerima.trim()) return "Isi PT Pengirim dan PT Penerima.";
    } else if (!status || !ptKoordinator.trim()) {
      return "Pilih status dan isi nama PT.";
    }
    return "";
  }

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesanError("");

    if (duaLangkah && langkah === 1) {
      const pesan = cekAsalPt();
      if (pesan) {
        setPesanError(pesan);
        return;
      }
      setLangkah(2);
      return;
    }

    if (!passwordOk) {
      setPesanError("Password belum memenuhi semua syarat.");
      return;
    }

    const tambahan: Record<string, string> = {};
    if (role === "PESERTA") {
      tambahan.roleDiminta = "PESERTA";
      tambahan.nim = nim.trim();
      tambahan.ptPengirim = ptPengirim.trim();
      tambahan.ptPenerima = ptPenerima.trim();
    } else if (role === "KOORDINATOR") {
      tambahan.roleDiminta = "KOORDINATOR";
      tambahan.nidn = nidn.trim();
      tambahan.statusKoordinator = status;
      if (status === "PENGIRIM") tambahan.ptPengirim = ptKoordinator.trim();
      else tambahan.ptPenerima = ptKoordinator.trim();
    }

    setLoading(true);
    const daftarSekali = () =>
      authClient.signUp.email({
        name: nama.trim(),
        email: email.trim(),
        password,
        username: buatUsername(nama),
        ...tambahan,
      });

    let hasil = await daftarSekali();
    for (let i = 0; i < 2 && hasil.error?.code?.startsWith("USERNAME_IS_ALREADY_TAKEN"); i++) {
      hasil = await daftarSekali();
    }
    setLoading(false);

    if (hasil.error) {
      setPesanError(pesanDariError(hasil.error));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={kirim} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Daftar</h1>
        <p className="text-muted-foreground text-sm">Bergabunglah dengan komunitas PMM Connect.</p>
      </div>

      <div className="bg-muted relative grid grid-cols-3 rounded-xl p-1" role="tablist">
        <div
          className="bg-background absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-lg shadow-sm transition-transform duration-200"
          style={{ transform: `translateX(${indeksRole * 100}%)` }}
        />
        {DAFTAR_ROLE.map((r) => (
          <button
            key={r.nilai}
            type="button"
            role="tab"
            aria-selected={role === r.nilai}
            onClick={() => gantiRole(r.nilai)}
            className={`relative z-10 rounded-lg py-2 text-sm font-medium transition-colors ${
              role === r.nilai ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {duaLangkah && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${langkah >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${langkah >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
          <p className="text-muted-foreground text-xs">
            Langkah {langkah} dari 2: {langkah === 1 ? "Asal PT" : "Akun"}
          </p>
        </div>
      )}

      {pesanError && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
          {pesanError}
        </p>
      )}

      <datalist id="daftar-pt">
        {daftarPt.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {duaLangkah && langkah === 1 && role === "PESERTA" && (
        <div className="space-y-4">
          <Field id="pt-pengirim" label="PT Pengirim">
            <Input
              id="pt-pengirim"
              list="daftar-pt"
              placeholder="Pilih atau ketik nama PT"
              maxLength={150}
              value={ptPengirim}
              onChange={(e) => setPtPengirim(e.target.value)}
            />
          </Field>
          <Field id="pt-penerima" label="PT Penerima">
            <Input
              id="pt-penerima"
              list="daftar-pt"
              placeholder="Pilih atau ketik nama PT"
              maxLength={150}
              value={ptPenerima}
              onChange={(e) => setPtPenerima(e.target.value)}
            />
          </Field>
          <p className="text-muted-foreground text-xs">
            Tidak ada dalam daftar? Ketik sendiri nama PT-nya.
          </p>
        </div>
      )}

      {duaLangkah && langkah === 1 && role === "KOORDINATOR" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["PENGIRIM", "PENERIMA"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg border py-2 text-sm transition-colors ${
                    status === s
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {s === "PENGIRIM" ? "PT Pengirim" : "PT Penerima"}
                </button>
              ))}
            </div>
          </div>
          <Field id="pt-koordinator" label="PT">
            <Input
              id="pt-koordinator"
              list="daftar-pt"
              placeholder="Pilih atau ketik nama PT"
              maxLength={150}
              value={ptKoordinator}
              onChange={(e) => setPtKoordinator(e.target.value)}
            />
          </Field>
          <p className="text-muted-foreground text-xs">
            Tidak ada dalam daftar? Ketik sendiri nama PT-nya.
          </p>
        </div>
      )}

      {tampilAkun && (
        <div className="space-y-4">
          {role === "PESERTA" && (
            <Field id="nim" label="NIM">
              <Input id="nim" required maxLength={30} value={nim} onChange={(e) => setNim(e.target.value)} />
            </Field>
          )}
          {role === "KOORDINATOR" && (
            <Field id="nidn" label="NIDN">
              <Input id="nidn" required maxLength={30} value={nidn} onChange={(e) => setNidn(e.target.value)} />
            </Field>
          )}
          <Field id="nama" label="Nama lengkap">
            <Input
              id="nama"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </Field>
          <Field id="email" label="Email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field id="password" label="Password">
            <div className="relative">
              <Input
                id="password"
                type={lihat ? "text" : "password"}
                autoComplete="new-password"
                required
                maxLength={128}
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
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
              {aturan.map((a) => (
                <li
                  key={a.teks}
                  className={`flex items-center gap-1.5 text-xs ${
                    a.ok ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  {a.ok ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
                  {a.teks}
                </li>
              ))}
            </ul>
          </Field>
          {duaLangkah && (
            <p className="text-muted-foreground text-xs">
              Akunmu akan diverifikasi Koordinator. Selama menunggu, kamu masuk sebagai Umum.
            </p>
          )}
        </div>
      )}

      {duaLangkah && langkah === 2 ? (
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button type="button" variant="outline" className="h-10" onClick={() => setLangkah(1)}>
            <ArrowLeft className="size-4" />
            Kembali
          </Button>
          <Button type="submit" disabled={loading} className="bg-brand-gradient h-10 text-white">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Daftar
          </Button>
        </div>
      ) : (
        <Button type="submit" disabled={loading} className="bg-brand-gradient h-10 w-full text-white">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {duaLangkah ? "Lanjut" : "Daftar"}
        </Button>
      )}

      <p className="text-muted-foreground text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="text-primary font-semibold hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}