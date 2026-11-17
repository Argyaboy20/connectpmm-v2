"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { aturIkuti } from "@/server/ikuti";

export function TombolIkuti({
  targetId,
  masuk,
  awal = false,
  saatIkuti,
}: {
  targetId: string;
  masuk: boolean;
  awal?: boolean;
  saatIkuti?: () => void;
}) {
  const router = useRouter();
  const [ikuti, setIkuti] = useState(awal);
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  function klik() {
    if (!masuk) {
      router.push("/masuk");
      return;
    }
    const baru = !ikuti;
    setIkuti(baru);
    setPesan("");
    mulai(async () => {
      const h = await aturIkuti(targetId, baru);
      if (!h.ok) {
        setIkuti(!baru);
        setPesan(h.pesan);
        return;
      }
      if (baru) saatIkuti?.();
    });
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={klik}
        disabled={proses}
        aria-pressed={ikuti}
        className={`h-8 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${
          ikuti ? "hover:bg-muted border" : "bg-brand-gradient text-white"
        }`}
      >
        {ikuti ? "Mengikuti" : "Ikuti"}
      </button>
      {pesan && (
        <p role="alert" className="text-destructive mt-1 max-w-32 text-xs">
          {pesan}
        </p>
      )}
    </div>
  );
}