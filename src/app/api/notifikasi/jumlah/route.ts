import { NextResponse } from "next/server";
import { ambilSesi } from "@/lib/sesi";
import { jumlahBelumDibaca } from "@/lib/notifikasi";
import { jumlahPesanBelumDibaca } from "@/lib/pesan";

export async function GET() {
  const sesi = await ambilSesi();
  const [jumlah, pesan] = sesi
    ? await Promise.all([jumlahBelumDibaca(sesi.user.id), jumlahPesanBelumDibaca(sesi.user.id)])
    : [0, 0];
  return NextResponse.json({ jumlah, pesan }, { headers: { "Cache-Control": "no-store" } });
}