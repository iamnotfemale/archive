import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getStore, storeErrorBody } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const store = await getStore();
    const all = await store.listWorks();
    const writable = await canWrite(req);
    return NextResponse.json(writable ? all : all.filter((w) => w.status === "published"));
  } catch (e) {
    if (process.env.VERCEL) return NextResponse.json([]);
    const { status, body } = storeErrorBody(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  try {
    const store = await getStore();
    const work = await store.createWork();
    return NextResponse.json({ work }, { status: 201 });
  } catch (e) {
    const { status, body } = storeErrorBody(e);
    console.error("POST /api/works failed:", body);
    return NextResponse.json(body, { status });
  }
}
