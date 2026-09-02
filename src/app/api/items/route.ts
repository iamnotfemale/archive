import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { fetchMeta } from "@/lib/meta";
import { getStore, storeErrorBody } from "@/lib/store";
import { normalizeUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json(await store.list());
  } catch (e) {
    // Reading never has to fail the page: an unconfigured database reads as an empty archive.
    if (process.env.VERCEL) return NextResponse.json([]);
    const { status, body } = storeErrorBody(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { url?: string; memo?: string; tag?: string; title?: string };
  const url = normalizeUrl(body.url ?? "");
  if (!url) return NextResponse.json({ error: "invalid url" }, { status: 400 });

  try {
    const store = await getStore();
    const existing = await store.findByUrl(url);
    if (existing) return NextResponse.json({ item: existing, existing: true });

    const meta = await fetchMeta(url, body.title?.trim() ?? "");
    const item = await store.create({
      url,
      domain: meta.domain,
      title: meta.title,
      description: meta.description,
      image: meta.image,
      memo: (body.memo ?? "").trim(),
      tag: (body.tag ?? "").trim(),
    });
    return NextResponse.json({ item, existing: false }, { status: 201 });
  } catch (e) {
    const { status, body: err } = storeErrorBody(e);
    console.error("POST /api/items failed:", err);
    return NextResponse.json(err, { status });
  }
}
