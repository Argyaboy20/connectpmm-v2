"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { logModerasi, user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import type { HasilAksi } from "./post";

const skemaNama = z
  .string("Nama tidak valid.")
  .trim()
  .min(2, "Nama minimal 2 karakter.")
  .max(100, "Nama maksimal 100 karakter.");

const skemaPt = z.string("PT tidak valid.").trim().min(1, "Nama PT wajib diisi.").max(150, "Nama PT maksimal 150 karakter.");

export async function ubahNama(nama: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const h = skemaNama.safeParse(nama);
  if (!h.success) return { ok: false, pesan: h.error.issues[0]?.message ?? "Nama tidak valid." };

  await db.update(user).set({ name: h.data }).where(eq(user.id, pelaku.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

// Peserta: kedua PT. Koordinator: hanya PT sesuai status pendaftarannya. Umum: tidak ada.
export async function ubahPt(masukan: { ptPengirim?: string; ptPenerima?: string }): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const [u] = await db
    .select({
      role: user.role,
      roleDiminta: user.roleDiminta,
      statusKoordinator: user.statusKoordinator,
      ptPengirim: user.ptPengirim,
      ptPenerima: user.ptPenerima,
    })
    .from(user)
    .where(eq(user.id, pelaku.id))
    .limit(1);
  if (!u) return { ok: false, pesan: "Akun tidak ditemukan." };

  const peran = u.roleDiminta ?? u.role;
  const baru: { ptPengirim?: string; ptPenerima?: string } = {};

  if (peran === "PESERTA") {
    const a = skemaPt.safeParse(masukan?.ptPengirim);
    const b = skemaPt.safeParse(masukan?.ptPenerima);
    if (!a.success) return { ok: false, pesan: `PT Pengirim: ${a.error.issues[0]?.message}` };
    if (!b.success) return { ok: false, pesan: `PT Penerima: ${b.error.issues[0]?.message}` };
    baru.ptPengirim = a.data;
    baru.ptPenerima = b.data;
  } else if (peran === "KOORDINATOR" && (u.statusKoordinator === "PENGIRIM" || u.statusKoordinator === "PENERIMA")) {
    if (u.statusKoordinator === "PENGIRIM") {
      const a = skemaPt.safeParse(masukan?.ptPengirim);
      if (!a.success) return { ok: false, pesan: a.error.issues[0]?.message ?? "PT tidak valid." };
      baru.ptPengirim = a.data;
    } else {
      const b = skemaPt.safeParse(masukan?.ptPenerima);
      if (!b.success) return { ok: false, pesan: b.error.issues[0]?.message ?? "PT tidak valid." };
      baru.ptPenerima = b.data;
    }
  } else {
    return { ok: false, pesan: "Akunmu tidak punya data PT yang bisa diubah." };
  }

  const lama = { ptPengirim: u.ptPengirim, ptPenerima: u.ptPenerima };
  const berubah: string[] = [];
  if (baru.ptPengirim !== undefined && baru.ptPengirim !== lama.ptPengirim) {
    berubah.push(`Pengirim: ${lama.ptPengirim ?? "-"} → ${baru.ptPengirim}`);
  }
  if (baru.ptPenerima !== undefined && baru.ptPenerima !== lama.ptPenerima) {
    berubah.push(`Penerima: ${lama.ptPenerima ?? "-"} → ${baru.ptPenerima}`);
  }
  if (berubah.length === 0) return { ok: false, pesan: "Tidak ada perubahan." };

  const [l] = await db
    .insert(logModerasi)
    .values({
      aktorId: pelaku.id,
      aksi: "UBAH_PT",
      sasaranTipe: "USER",
      sasaranId: pelaku.id,
      catatan: JSON.stringify({
        cuplikan: berubah.join("; ").slice(0, 100),
        lama,
        baru,
        role: peran,
      }),
    })
    .returning({ id: logModerasi.id });

  try {
    await db.update(user).set(baru).where(eq(user.id, pelaku.id));
  } catch (e) {
    console.error("Gagal mengubah PT", e);
    await db.delete(logModerasi).where(eq(logModerasi.id, l.id)).catch(() => {});
    return { ok: false, pesan: "Gagal menyimpan. Coba lagi." };
  }

  revalidatePath("/akun");
  revalidatePath("/moderasi");
  return { ok: true };
}