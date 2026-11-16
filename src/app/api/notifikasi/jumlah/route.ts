import { NextResponse } from "next/server";
import { ambilSesi } from "@/lib/sesi";
import { jumlahBelumDibaca } from "@/lib/notifikasi";

export async function GET() {
  const sesi = await ambilSesi();
  const jumlah = sesi ? await jumlahBelumDibaca(sesi.user.id) : 0;
  return NextResponse.json({ jumlah }, { headers: { "Cache-Control": "no-store" } });
}