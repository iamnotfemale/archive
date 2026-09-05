import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getStore, storeErrorBody } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Published posts for everyone; drafts too when the caller holds the key. */
export async function GET(req: Request) {
  try {
    const store = await getStore();
    const all = await store.listPosts();
    const writable = await canWrite(req);
    return NextResponse.json(writable ? all : all.filter((p) => p.status === "published" && p.scope === "public"));
  } catch (e) {
    if (process.env.VERCEL) return NextResponse.json([]);
    const { status, body } = storeErrorBody(e);
    return NextResponse.json(body, { status });
  }
}

/** Start a new draft. */
export async function POST(req: Request) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string; body?: string };
  try {
    const store = await getStore();
    const post = await store.createPost({ title: body.title ?? "", body: body.body ?? "" });
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("POST /api/posts failed:", err);
    return NextResponse.json(err, { status });
  }
}
