/** What the studio (yeoziphab.com) makes, read from its public lists. Shown under Works. */
export type StudioThing = { kind: "Product" | "Lab"; name: string; title: string; href: string; date: string };

const API = "https://yeoziphab.com/api";

/** Fetched on the server; a slow or missing studio site just hides the block. */
export async function loadStudio(): Promise<StudioThing[]> {
  const get = async <T,>(path: string): Promise<T[]> => {
    try {
      const r = await fetch(`${API}/${path}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(3000) });
      return r.ok ? ((await r.json()) as T[]) : [];
    } catch {
      return [];
    }
  };
  const [products, labs] = await Promise.all([
    get<{ name: string; short: string; title: string; url: string; date: string; ph?: boolean }>("products"),
    get<{ name: string; title: string; host: string; date: string }>("lab"),
  ]);
  return [
    ...products.filter((p) => !p.ph && p.name).map((p) => ({ kind: "Product" as const, name: p.short || p.name, title: p.title || p.name, href: p.url && p.url !== "#" ? p.url : "https://yeoziphab.com/products", date: p.date })),
    ...labs.filter((l) => l.host || l.title).map((l) => ({ kind: "Lab" as const, name: l.name, title: l.title, href: l.host ? `https://${l.host}` : "https://yeoziphab.com/labs", date: l.date })),
  ];
}

export default function FromStudio({ items, no }: { items: StudioThing[]; no: string }) {
  if (!items.length) return null;
  return (
    <section className="g12 cv-block">
      <div className="c3 cv-label">
        <span className="no">{no}</span>
        <span className="lbl">From yeoziphab</span>
        <a className="fs-more" href="https://yeoziphab.com" target="_blank" rel="noreferrer">
          yeoziphab.com ↗
        </a>
      </div>
      <div className="c9">
        <div className="wk-grid">
          {items.map((x, i) => (
            <a key={i} href={x.href} target="_blank" rel="noreferrer" className="wk-card">
              <span className="wk-img fs-tile">
                <span className="wk-word">
                  {x.name.toLowerCase()}
                  <span className="ac">.</span>
                </span>
                <span className="fs-kind">{x.kind}</span>
              </span>
              <span className="wk-meta">
                <span className="wk-t">{x.title}</span>
                <span className="wk-y">{x.date}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
