import { NextResponse } from "next/server";
import { fetchMeta } from "@/lib/meta";
import { normalizeUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const url = normalizeUrl(sp.get("url") ?? "");
  if (!url) return NextResponse.json({ error: "invalid url" }, { status: 400 });
  const meta = await fetchMeta(url, sp.get("title") ?? "");
  return NextResponse.json({ url, ...meta });
}
