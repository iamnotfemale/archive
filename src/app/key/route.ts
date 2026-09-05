import { NextResponse } from "next/server";
import { KEY_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Visit /key?t=<ARCHIVE_TOKEN> once in a browser to unlock writing there.
 * Visit /key?t= (empty) to lock again.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const t = u.searchParams.get("t") ?? "";
  const res = NextResponse.redirect(new URL("/archive", u.origin));
  if (t) {
    res.cookies.set(KEY_COOKIE, t, {
      httpOnly: true,
      sameSite: "lax",
      secure: u.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    res.cookies.delete(KEY_COOKIE);
  }
  return res;
}
