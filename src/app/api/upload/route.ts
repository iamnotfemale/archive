import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { canWrite } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX = 12 * 1024 * 1024; // 12 MB
const OK_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);

/**
 * 이미지 올리기. Vercel Blob(BLOB_READ_WRITE_TOKEN)이 있으면 거기에, 없고 로컬이면 public/uploads 에 저장.
 * 응답: { url }
 */
export async function POST(req: Request) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (!OK_TYPES.has(file.type)) return NextResponse.json({ error: "bad_type" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase() || ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "image/svg+xml": ".svg" }[file.type] ?? "");
  const name = `${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`work/${name}`, file, { access: "public", contentType: file.type, addRandomSuffix: false });
    return NextResponse.json({ url: blob.url });
  }

  if (process.env.VERCEL) return NextResponse.json({ error: "no_blob", detail: "BLOB_READ_WRITE_TOKEN is not set" }, { status: 503 });

  // local dev: public/uploads is served by next dev
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
