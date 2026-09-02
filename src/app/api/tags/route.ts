import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { distinctTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  return NextResponse.json(distinctTags(await store.list()));
}
