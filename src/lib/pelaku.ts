import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ambilSesi } from "./sesi";

export async function ambilPelaku() {
  const sesi = await ambilSesi();
  if (!sesi) return null;
  const [u] = await db
    .select({ id: user.id, role: user.role, status: user.status })
    .from(user)
    .where(eq(user.id, sesi.user.id))
    .limit(1);
  return u ?? null;
}