import { cookies } from "next/headers";

export const KEY_COOKIE = "archive_key";

/** Write access: open when ARCHIVE_TOKEN is unset (local dev), otherwise cookie or bearer must match. */
export async function canWrite(req?: Request): Promise<boolean> {
  const token = process.env.ARCHIVE_TOKEN;
  if (!token) return true;
  const bearer = req?.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (bearer && safeEqual(bearer, token)) return true;
  const jar = await cookies();
  const c = jar.get(KEY_COOKIE)?.value;
  return !!c && safeEqual(c, token);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
