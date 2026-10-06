import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
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
    const w = await (await getStore()).getWorkBySlug(slug);
    return w && w.status === "published" ? { title: `${w.title} — ${site.name}`, description: w.note || excerpt(w.body) } : { title: site.name };
  } catch {
    return { title: site.name };
  }
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore();
  const [w, writable] = await Promise.all([store.getWorkBySlug(slug), canWrite()]);
  if (!w || (w.status !== "published" && !writable)) notFound();
  const published = (await store.listWorks()).filter((x) => x.status === "published");
  const idx = published.findIndex((x) => x.id === w.id);
  const next = idx >= 0 && published.length > 1 ? published[(idx + 1) % published.length] : null;

  return (
    <div id="top">
      <Nav />
      <div className="wrap">
        <div className="g12 read-head">
          <div className="read-main">
            <Link href="/" className="read-back">
              ← Portfolio
            </Link>
            <h1>{w.title || "Untitled"}</h1>
            {w.note && <p className="read-sub">{w.note}</p>}
            <div className="read-meta">
              {w.year && <span>{w.year}</span>}
              {w.kind && <span>{w.kind}</span>}
              {w.status === "draft" && <span style={{ color: "var(--ac)" }}>Draft</span>}
              {writable && <OwnerActions editHref={`/?edit=${w.id}`} deleteUrl={`/api/works/${w.id}`} afterDelete="/" />}
            </div>
          </div>
        </div>
        <div className="g12 read-body">
          <div className="read-text">{renderBody(w.body)}</div>
        </div>
        {next && (
          <div className="g12 read-next">
            <div className="c3">Next</div>
            <Link href={`/portfolio/${next.slug}`}>
              <span>{next.title || "Untitled"}</span>
              <span className="mute" style={{ fontSize: 14 }}>
                →
              </span>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
