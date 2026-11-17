"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { logModerasi, user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { ambilSesi } from "@/lib/sesi";
import { skemaAlasan } from "@/lib/validasi-moderasi";
import type { HasilAksi } from "./post";

const skemaIdUser = z.string().min(1).max(100);

type Cek = { ok: true; id: string } | { ok: false; pesan: string };

async function cekKoordinator(): Promise<Cek> {
  const p = await ambilPelaku();
  if (!p) return { ok: false, pesan: "Masuk dulu." };
  if (p.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };
  if (p.role !== "KOORDINATOR") return { ok: false, pesan: "Kamu tidak berhak melakukan ini." };
  return { ok: true, id: p.id };
}

async function cariPemohon(id: string) {
  const [t] = await db
    .select({ id: user.id, roleDiminta: user.roleDiminta })
    .from(user)
    .where(and(eq(user.id, id), isNotNull(user.roleDiminta), eq(user.status, "AKTIF")))
    .limit(1);
  return t && t.roleDiminta ? { id: t.id, roleDiminta: t.roleDiminta } : null;
}

export async function setujuiPemohon(
  userId: string,
  konfirmasiKoordinator?: boolean,
): Promise<HasilAksi> {
  const c = await cekKoordinator();
  if (!c.ok) return { ok: false, pesan: c.pesan };

  const id = skemaIdUser.safeParse(userId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };
  if (id.data === c.id) return { ok: false, pesan: "Kamu tidak bisa menyetujui dirimu sendiri." };

  const t = await cariPemohon(id.data);
  if (!t) return { ok: false, pesan: "Pemohon tidak ditemukan." };
  if (t.roleDiminta === "KOORDINATOR" && konfirmasiKoordinator !== true) {
    return { ok: false, pesan: "Persetujuan Koordinator perlu konfirmasi tambahan." };
  }

  const [l] = await db
    .insert(logModerasi)
    .values({
      aktorId: c.id,
      aksi: "SETUJUI_PEMOHON",
      sasaranTipe: "USER",
      sasaranId: t.id,
      catatan: JSON.stringify({ role: t.roleDiminta }),
    })
    .returning({ id: logModerasi.id });

  const diubah = await db
    .update(user)
    .set({
      role: t.roleDiminta,
      roleDiminta: null,
      roleDitolak: null,
      alasanPenolakan: null,
      disetujuiOleh: c.id,
      disetujuiPada: new Date(),
    })
    .where(and(eq(user.id, t.id), eq(user.roleDiminta, t.roleDiminta)))
    .returning({ id: user.id });
  if (diubah.length === 0) {
    await db.delete(logModerasi).where(eq(logModerasi.id, l.id)).catch(() => {});
    return { ok: false, pesan: "Pemohon tidak ditemukan." };
  }

  revalidatePath("/moderasi");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function tolakPemohon(userId: string, alasan?: string): Promise<HasilAksi> {
  const c = await cekKoordinator();
  if (!c.ok) return { ok: false, pesan: c.pesan };

  const id = skemaIdUser.safeParse(userId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const a = skemaAlasan.safeParse(alasan);
  if (!a.success) {
    return { ok: false, pesan: a.error.issues[0]?.message ?? "Alasan tidak valid." };
  }

  const t = await cariPemohon(id.data);
  if (!t) return { ok: false, pesan: "Pemohon tidak ditemukan." };

  const [l] = await db
    .insert(logModerasi)
    .values({
      aktorId: c.id,
      aksi: "TOLAK_PEMOHON",
      sasaranTipe: "USER",
      sasaranId: t.id,
      catatan: JSON.stringify({ role: t.roleDiminta, alasan: a.data }),
    })
    .returning({ id: logModerasi.id });

  const diubah = await db
    .update(user)
    .set({ roleDiminta: null, roleDitolak: t.roleDiminta, alasanPenolakan: a.data })
    .where(and(eq(user.id, t.id), eq(user.roleDiminta, t.roleDiminta)))
    .returning({ id: user.id });
  if (diubah.length === 0) {
    await db.delete(logModerasi).where(eq(logModerasi.id, l.id)).catch(() => {});
    return { ok: false, pesan: "Pemohon tidak ditemukan." };
  }

  revalidatePath("/moderasi");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function tutupPenolakan(): Promise<HasilAksi> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu." };
  await db
    .update(user)
    .set({ roleDitolak: null, alasanPenolakan: null })
    .where(eq(user.id, sesi.user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

const skemaAjuan = z.object({
  nim: z.string("NIM tidak valid.").trim().min(1, "NIM wajib diisi.").max(30, "NIM maksimal 30 karakter."),
  ptPengirim: z
    .string("PT tidak valid.")
    .trim()
    .min(1, "PT Pengirim wajib diisi.")
    .max(150, "Nama PT maksimal 150 karakter."),
  ptPenerima: z
    .string("PT tidak valid.")
    .trim()
    .min(1, "PT Penerima wajib diisi.")
    .max(150, "Nama PT maksimal 150 karakter."),
});

// Koordinator yang ditolak boleh mengajukan ulang sebagai Peserta.
export async function ajukanPeserta(masukan: {
  nim: string;
  ptPengirim: string;
  ptPenerima: string;
}): Promise<HasilAksi> {
  const p = await ambilPelaku();
  if (!p) return { ok: false, pesan: "Masuk dulu." };
  if (p.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const h = skemaAjuan.safeParse(masukan);
  if (!h.success) return { ok: false, pesan: h.error.issues[0]?.message ?? "Data tidak valid." };

  const diubah = await db
    .update(user)
    .set({
      roleDiminta: "PESERTA",
      roleDitolak: null,
      alasanPenolakan: null,
      nim: h.data.nim,
      ptPengirim: h.data.ptPengirim,
      ptPenerima: h.data.ptPenerima,
      nidn: null,
      statusKoordinator: null,
    })
    .where(
      and(
        eq(user.id, p.id),
        eq(user.role, "UMUM"),
        eq(user.roleDitolak, "KOORDINATOR"),
        isNull(user.roleDiminta),
      ),
    )
    .returning({ id: user.id });
  if (diubah.length === 0) {
    return { ok: false, pesan: "Pengajuan ulang hanya untuk Koordinator yang ditolak." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/moderasi");
  return { ok: true };
}