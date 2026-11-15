import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const FOLDER_LOKAL = path.join(process.cwd(), ".penyimpanan");

const MIME: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
};

function mimeDari(kunci: string) {
  return MIME[kunci.split(".").pop() ?? ""] ?? "application/octet-stream";
}

function konfigR2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET) {
    return {
      akun: R2_ACCOUNT_ID,
      id: R2_ACCESS_KEY_ID,
      rahasia: R2_SECRET_ACCESS_KEY,
      bucket: R2_BUCKET,
    };
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Variabel R2_* belum diisi di produksi.");
  }
  return null;
}

let klien: S3Client | null = null;

function ambilKlien(k: NonNullable<ReturnType<typeof konfigR2>>) {
  klien ??= new S3Client({
    region: "auto",
    endpoint: `https://${k.akun}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: k.id, secretAccessKey: k.rahasia },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return klien;
}

function jalurLokal(kunci: string) {
  const jalur = path.join(FOLDER_LOKAL, ...kunci.split("/"));
  if (!jalur.startsWith(FOLDER_LOKAL + path.sep)) throw new Error("Kunci tidak valid.");
  return jalur;
}

export async function simpanFile(kunci: string, bytes: Uint8Array, mime: string) {
  const k = konfigR2();
  if (!k) {
    const jalur = jalurLokal(kunci);
    await mkdir(path.dirname(jalur), { recursive: true });
    await writeFile(jalur, bytes);
    return;
  }
  await ambilKlien(k).send(
    new PutObjectCommand({ Bucket: k.bucket, Key: kunci, Body: bytes, ContentType: mime }),
  );
}

export async function ambilFile(kunci: string) {
  const k = konfigR2();
  if (!k) {
    try {
      return { bytes: await readFile(jalurLokal(kunci)), mime: mimeDari(kunci) };
    } catch (e) {
      if ((e as { code?: string }).code === "ENOENT") return null;
      throw e;
    }
  }
  try {
    const r = await ambilKlien(k).send(new GetObjectCommand({ Bucket: k.bucket, Key: kunci }));
    if (!r.Body) return null;
    return { bytes: await r.Body.transformToByteArray(), mime: r.ContentType ?? mimeDari(kunci) };
  } catch (e) {
    if ((e as { name?: string }).name === "NoSuchKey") return null;
    throw e;
  }
}

export async function hapusFile(kunci: string[]) {
  if (kunci.length === 0) return;
  const k = konfigR2();
  if (!k) {
    await Promise.all(kunci.map((x) => rm(jalurLokal(x), { force: true })));
    return;
  }
  await ambilKlien(k).send(
    new DeleteObjectsCommand({
      Bucket: k.bucket,
      Delete: { Objects: kunci.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}