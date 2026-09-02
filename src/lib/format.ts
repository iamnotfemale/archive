/* Dates are always rendered in Asia/Seoul so server and client agree (no hydration drift). */
const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric" });

function ymd(iso: string) {
  const parts = fmt.formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function monthKey(iso: string): string {
  const { y, m } = ymd(iso);
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}년 ${Number(m)}월`;
}

export function dayLabel(iso: string): string {
  const { m, d } = ymd(iso);
  return `${m}. ${String(d).padStart(2, "0")}`;
}

export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}
