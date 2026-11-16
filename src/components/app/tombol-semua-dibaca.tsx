"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { tandaiSemuaDibaca } from "@/server/notifikasi";

export function TombolSemuaDibaca() {
  const router = useRouter();
  const [proses, mulai] = useTransition();

  function klik() {
    mulai(async () => {
      await tandaiSemuaDibaca();
      window.dispatchEvent(new Event("notifikasi-berubah"));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={klik}
      disabled={proses}
      className="text-primary text-sm font-semibold disabled:opacity-50"
    >
      Tandai semua dibaca
    </button>
  );
}