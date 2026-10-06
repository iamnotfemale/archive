import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getStore, storeErrorBody } from "@/lib/store";
import { lab as seed, type LabItem } from "@/content/lab";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json((await store.getLab()) ?? seed, { headers: { "access-control-allow-origin": "*" } });
  } catch {
    return NextResponse.json(seed, { headers: { "access-control-allow-origin": "*" } });
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Whole-list replace, validated and trimmed. */
export async function PUT(req: Request) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const raw = (await req.json().catch(() => null)) as unknown;
  if (!Array.isArray(raw)) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const items: LabItem[] = raw.slice(0, 50).map((x: Partial<LabItem>) => ({
    name: str(x?.name, 40),
    title: str(x?.title, 120),
    desc: str(x?.desc, 300),
    host: str(x?.host, 120)
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, ""),
    date: str(x?.date, 20),
    stack: str(x?.stack, 80),
    built: str(x?.built, 40),
  }));
  try {
    const store = await getStore();
    return NextResponse.json(await store.setLab(items));
  } catch (e) {
    const { status, body } = storeErrorBody(e);
    console.error("PUT /api/lab failed:", body);
    return NextResponse.json(body, { status });
  }
}
