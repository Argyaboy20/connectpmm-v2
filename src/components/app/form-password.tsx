"use client";

import { useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function FormPassword() {
  const [buka, setBuka] = useState(false);
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [pesan, setPesan] = useState("");
  const [berhasil, setBerhasil] = useState(false);
  const [proses, setProses] = useState(false);

  const aturan = [
    { ok: baru.length >= 8, teks: "Minimal 8 karakter" },
    { ok: /[A-Z]/.test(baru), teks: "Huruf kapital" },
    { ok: /[a-z]/.test(baru), teks: "Huruf kecil" },
    { ok: /[0-9]/.test(baru), teks: "Angka" },
  ];
  const valid = lama.length > 0 && aturan.every((a) => a.ok);

  async function simpan() {
    setPesan("");
    setProses(true);
    try {
      const h = await authClient.changePassword({
        currentPassword: lama,
        newPassword: baru,
        revokeOtherSessions: true,
      });
      if (h.error) {
        setPesan(
          h.error.code === "INVALID_PASSWORD"
            ? "Password lama salah."
            : (h.error.message ?? "Gagal mengganti password."),
        );
        return;
      }
      setLama("");
      setBaru("");
      setBuka(false);
      setBerhasil(true);
    } catch {
      setPesan("Terjadi kesalahan. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  if (!buka) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => {
            setBuka(true);
            setBerhasil(false);
          }}
          className="hover:bg-muted inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold"
        >
          Ubah password
        </button>
        {berhasil && (
          <p className="text-xs text-emerald-600">Password diganti. Sesi di perangkat lain sudah diakhiri.</p>
        )}
      </div>
    );
  }

  const kolom = "h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none";
  return (
    <div className="w-full space-y-3">
      <input
        type="password"
        value={lama}
        onChange={(e) => setLama(e.target.value)}
        autoComplete="current-password"
        placeholder="Password lama"
        aria-label="Password lama"
        maxLength={128}
        className={kolom}
      />
      <input
        type="password"
        value={baru}
        onChange={(e) => setBaru(e.target.value)}
        autoComplete="new-password"
        placeholder="Password baru"
        aria-label="Password baru"
        maxLength={128}
        className={kolom}
      />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {aturan.map((a) => (
          <li
            key={a.teks}
            className={`flex items-center gap-1.5 text-xs ${a.ok ? "text-emerald-600" : "text-muted-foreground"}`}
          >
            {a.ok ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
            {a.teks}
          </li>
        ))}
      </ul>
      {pesan && (
        <p role="alert" className="text-destructive text-sm">
          {pesan}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setBuka(false);
            setLama("");
            setBaru("");
            setPesan("");
          }}
          disabled={proses}
          className="hover:bg-muted h-9 rounded-lg border px-4 text-sm font-semibold"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={simpan}
          disabled={proses || !valid}
          className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {proses && <Loader2 className="size-4 animate-spin" />}
          Simpan
        </button>
      </div>
    </div>
  );
}