import Link from "next/link";
import { notFound } from "next/navigation";
import Rail from "@/components/Rail";
import OwnerActions from "@/components/OwnerActions";
import { site } from "@/content/site";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { renderBody, excerpt } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const store = await getStore();
    const w = await store.getWorkBySlug(slug);
    return w && w.status === "published" ? { title: `${w.title} — ${site.name}`, description: w.note || excerpt(w.body) } : { title: site.name };
  } catch {
    return { title: site.name };
  }
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore();
  const [w, writable] = await Promise.all([store.getWorkBySlug(slug), canWrite()]);
  if (!w) notFound();
  if (w.status !== "published" && !writable) notFound();

  const published = (await store.listWorks()).filter((x) => x.status === "published");
  const idx = published.findIndex((x) => x.id === w.id);
  const next = idx >= 0 ? published[idx + 1] ?? (published.length > 1 ? published[0] : null) : null;

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
            <h1 className="post-title">{w.title || "제목 없음"}</h1>
            {w.note && <div className="post-subtitle">{w.note}</div>}
            <div className="post-meta">
              {w.kind && <span>{w.kind}</span>}
              {w.role && <span>{w.role}</span>}
              {w.year && <span>{w.year}</span>}
              {w.status === "draft" && <span>초안</span>}
              {writable && <OwnerActions editHref={`/portfolio?edit=${w.id}`} deleteUrl={`/api/works/${w.id}`} afterDelete="/portfolio" />}
            </div>
            <div className="post-body">{renderBody(w.body)}</div>
            {next && next.id !== w.id && (
              <div className="post-next">
                <span className="pv-esc" style={{ cursor: "default" }}>
                  다음
                </span>
                <Link href={`/portfolio/${next.slug}`} className="post-next-link">
                  {next.title || "제목 없음"} →
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
