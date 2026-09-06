import { NextResponse } from "next/server";
import { canWrite } from "@/lib/auth";
import { getStore, storeErrorBody } from "@/lib/store";
import { defaultProfile } from "@/content/profile";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json((await store.getProfile()) ?? defaultProfile());
  } catch {
    return NextResponse.json(defaultProfile());
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const id = (v: unknown, fallback: string) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : fallback);

/** Whole-document replace. The shape is validated and trimmed; unknown keys are dropped. */
export async function PUT(req: Request) {
  if (!(await canWrite(req))) return NextResponse.json({ error: "locked" }, { status: 401 });
  const raw = (await req.json().catch(() => null)) as Partial<Profile> | null;
  if (!raw || typeof raw !== "object") return NextResponse.json({ error: "bad_body" }, { status: 400 });

  const sections = Array.isArray(raw.sections) ? raw.sections.slice(0, 20) : [];
  const contacts = Array.isArray(raw.contacts) ? raw.contacts.slice(0, 20) : [];
  const profile: Profile = {
    intro: str(raw.intro, 300),
    sub: str(raw.sub, 600),
    sections: sections.map((s, i) => ({
      id: id(s?.id, `s${i + 1}`),
      label: str(s?.label, 40),
      rows: (Array.isArray(s?.rows) ? s.rows.slice(0, 50) : []).map((r, j) => ({
        id: id(r?.id, `s${i + 1}r${j + 1}`),
        title: str(r?.title, 120),
        sub: str(r?.sub, 200),
        when: str(r?.when, 40),
      })),
    })),
    contacts: contacts.map((c, i) => ({ id: id(c?.id, `c${i + 1}`), label: str(c?.label, 40), value: str(c?.value, 120), href: str(c?.href, 500) })),
  };

  try {
    const store = await getStore();
    return NextResponse.json({ profile: await store.setProfile(profile) });
  } catch (e) {
    const { status, body } = storeErrorBody(e);
    console.error("PUT /api/profile failed:", body);
    return NextResponse.json(body, { status });
  }
}
