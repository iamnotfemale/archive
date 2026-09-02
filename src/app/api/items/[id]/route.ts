import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getStore, storeErrorBody } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { memo?: string; tag?: string; title?: string };
  try {
    const store = await getStore();
    const item = await store.update(id, {
      memo: body.memo !== undefined ? body.memo.trim() : undefined,
      tag: body.tag !== undefined ? body.tag.trim() : undefined,
      title: body.title !== undefined ? body.title.trim() : undefined,
    });
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("PATCH /api/items failed:", err);
    return NextResponse.json(err, { status });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const { id } = await params;
  try {
    const store = await getStore();
    const ok = await store.remove(id);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("DELETE /api/items failed:", err);
    return NextResponse.json(err, { status });
  }
}
