const TRACKING = /^(utm_|fbclid|gclid|igshid|mc_cid|mc_eid|ref_src|ref_url)/i;

/** Normalize a user-supplied URL: add scheme, strip tracking params and hash. */
export function normalizeUrl(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (!u.hostname.includes(".")) return null;
    for (const k of Array.from(u.searchParams.keys())) {
      if (TRACKING.test(k)) u.searchParams.delete(k);
    }
    u.hash = "";
    let out = u.toString();
    if (out.endsWith("?")) out = out.slice(0, -1);
    return out;
  } catch {
    return null;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Pull every http(s) URL out of a blob of pasted text (e.g. a KakaoTalk export). */
export function extractUrls(text: string): string[] {
  const re = /https?:\/\/[^\s<>"'()\[\]{}]+/gi;
  const found = text.match(re) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of found) {
    const cleaned = raw.replace(/[.,;:!?…]+$/, "");
    const n = normalizeUrl(cleaned);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
