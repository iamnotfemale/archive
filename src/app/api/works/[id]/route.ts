import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getStore, storeErrorBody } from "@/lib/store";
import type { WorkPatch } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as WorkPatch;

  const patch: WorkPatch = {};
  const str = (k: keyof WorkPatch, max: number) => {
    const v = body[k];
    if (v !== undefined) (patch as Record<string, string>)[k] = String(v).slice(0, max);
  };
  str("title", 200);
  str("kind", 60);
  str("role", 120);
  str("year", 20);
  str("note", 300);
  str("thumb", 2000);
  str("body", 200_000);
  if (body.status === "draft" || body.status === "published") patch.status = body.status;
  if (body.slug !== undefined) {
    const slug = String(body.slug).trim().toLowerCase();
    if (!SLUG.test(slug)) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
    patch.slug = slug;
  }

  try {
    const store = await getStore();
    if (patch.slug) {
      const taken = await store.getWorkBySlug(patch.slug);
      if (taken && taken.id !== id) return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    const work = await store.updateWork(id, patch);
    if (!work) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ work });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("PATCH /api/works failed:", err);
    return NextResponse.json(err, { status });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const { id } = await params;
  try {
    const store = await getStore();
    const ok = await store.removeWork(id);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("DELETE /api/works failed:", err);
    return NextResponse.json(err, { status });
  }
}
