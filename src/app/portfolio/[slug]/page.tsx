import Link from "next/link";
import { notFound } from "next/navigation";
import Rail from "@/components/Rail";
import { site } from "@/content/site";
import { works, type WorkSection } from "@/content/portfolio";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return works.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const w = works.find((x) => x.slug === slug);
  return { title: w ? `${w.title} — ${site.name}` : site.name };
}

function Placeholder({ src, caption, height }: { src?: string; caption?: string; height?: number }) {
  return (
    <div className="work-img" style={{ height: height ?? 400 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={caption ?? ""} loading="lazy" />
      ) : (
        <span>{caption ? `이미지 · ${caption}` : "이미지"}</span>
      )}
    </div>
  );
}

function Section({ s }: { s: WorkSection }) {
  if (s.type === "text") return <p className="work-text">{s.text}</p>;
  if (s.type === "image")
    return (
      <figure className="work-figure">
        <Placeholder src={s.src} caption={s.caption} height={s.height} />
        {s.caption && <figcaption className="work-caption">{s.caption}</figcaption>}
      </figure>
    );
  return (
    <div className="work-figures">
      {s.items.map((it, i) => (
        <figure key={i} className="work-figure" style={{ flex: 1 }}>
          <Placeholder src={it.src} caption={it.caption} height={s.height ?? 240} />
          {it.caption && it.src && <figcaption className="work-caption">{it.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const idx = works.findIndex((w) => w.slug === slug);
  if (idx < 0) notFound();
  const w = works[idx];
  const next = works[idx + 1] ?? works[0];

  return (
    <div className="page">
      <Rail>
        <Link href="/portfolio" className="side-sub rail-link">
          ← 작업 목록
        </Link>
      </Rail>

      <div className="body">
        <div className="grid">
          <div className="month-label-col">
            <div className="month-label">{w.year}</div>
          </div>
          <article className="post work">
            <h1 className="post-title">{w.title}</h1>
            <div className="post-meta">
              <span>{w.kind}</span>
              <span>{w.role}</span>
              <span>{w.year}</span>
            </div>
            <div className="work-body">
              {w.sections.map((s, i) => (
                <Section key={i} s={s} />
              ))}
            </div>
            {next.slug !== w.slug && (
              <div className="post-next">
                <span className="pv-esc" style={{ cursor: "default" }}>
                  다음
                </span>
                <Link href={`/portfolio/${next.slug}`} className="post-next-link">
                  {next.title} →
                </Link>
              </div>
            )}
          </article>
          <div />
        </div>
      </div>
    </div>
  );
}
