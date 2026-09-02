import { domainOf } from "./url";

export interface Meta {
  title: string;
  description: string;
  image: string;
  domain: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 archive-bot/1.0";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function metaContent(html: string, key: string): string {
  // <meta property="og:title" content="..."> in either attribute order
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return decodeEntities(m[1].trim());
  }
  return "";
}

function detectCharset(html: string, contentType: string | null): string {
  const ct = contentType?.match(/charset=([\w-]+)/i)?.[1];
  if (ct) return ct.toLowerCase();
  const m = html.match(/<meta[^>]+charset=["']?([\w-]+)/i);
  return (m?.[1] ?? "utf-8").toLowerCase();
}

export async function fetchMeta(url: string, hintTitle = ""): Promise<Meta> {
  const domain = domainOf(url);
  const fallback: Meta = { title: hintTitle || domain, description: "", image: "", domain };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "accept-language": "ko,en;q=0.8" },
    });
    const ctype = res.headers.get("content-type");
    if (!res.ok || (ctype && !/html|xml/i.test(ctype))) return fallback;

    const buf = new Uint8Array(await res.arrayBuffer());
    const head = buf.subarray(0, Math.min(buf.length, 400_000));
    let html = new TextDecoder("utf-8").decode(head);
    const cs = detectCharset(html, ctype);
    if (cs !== "utf-8" && cs !== "utf8") {
      try {
        html = new TextDecoder(cs).decode(head);
      } catch {
        /* keep utf-8 */
      }
    }

    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const title =
      metaContent(html, "og:title") || metaContent(html, "twitter:title") || decodeEntities(titleTag.replace(/\s+/g, " ").trim()) || hintTitle || domain;
    const description = metaContent(html, "og:description") || metaContent(html, "twitter:description") || metaContent(html, "description");
    let image = metaContent(html, "og:image") || metaContent(html, "og:image:url") || metaContent(html, "twitter:image");
    if (image) {
      try {
        image = new URL(image, res.url || url).toString();
      } catch {
        image = "";
      }
    }
    return { title: title.slice(0, 300), description: description.slice(0, 500), image, domain };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
