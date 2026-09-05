import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getStore, storeErrorBody } from "@/lib/store";
import type { PostPatch } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as PostPatch;

  const patch: PostPatch = {};
  if (body.title !== undefined) patch.title = String(body.title).slice(0, 200);
  if (body.subtitle !== undefined) patch.subtitle = String(body.subtitle).slice(0, 300);
  if (body.body !== undefined) patch.body = String(body.body);
  if (body.tag !== undefined) patch.tag = String(body.tag).trim().slice(0, 40);
  if (body.status === "draft" || body.status === "published") patch.status = body.status;
  if (body.scope === "public" || body.scope === "unlisted") patch.scope = body.scope;
  if (body.slug !== undefined) {
    const slug = String(body.slug).trim().toLowerCase();
    if (!SLUG.test(slug)) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
    patch.slug = slug;
  }

  try {
    const store = await getStore();
    if (patch.slug) {
      const taken = await store.getPostBySlug(patch.slug);
      if (taken && taken.id !== id) return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }
    const post = await store.updatePost(id, patch);
    if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("PATCH /api/posts failed:", err);
    return NextResponse.json(err, { status });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const { id } = await params;
  try {
    const store = await getStore();
    const ok = await store.removePost(id);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("DELETE /api/posts failed:", err);
    return NextResponse.json(err, { status });
  }
}
