import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import OwnerActions from "@/components/OwnerActions";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { renderBody, excerpt } from "@/lib/markdown";
import { fullDate } from "@/lib/format";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const post = await (await getStore()).getPostBySlug(slug);
    return post && post.status === "published" ? { title: `${post.title || "Untitled"} — writing`, description: post.subtitle || excerpt(post.body) } : { title: "writing" };
  } catch {
    return { title: "writing" };
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore();
  const [post, writable] = await Promise.all([store.getPostBySlug(slug), canWrite()]);
  if (!post || (post.status !== "published" && !writable)) notFound();
  const published = (await store.listPosts()).filter((p) => p.status === "published" && p.scope === "public");
  const idx = published.findIndex((p) => p.id === post.id);
  const next = idx >= 0 ? published[(idx + 1) % published.length] : null;
  const when = post.publishedAt ?? post.updatedAt;
  const mins = Math.max(1, Math.round(post.body.replace(/\s/g, "").length / 500));

  return (
    <div id="top">
      <Nav />
      <div className="wrap">
        <div className="g12 read-head">
          <div className="c3 read-side">
            <Link href="/write">← Writing</Link>
            <span>
              {String(idx + 1).padStart(2, "0")} · {fullDate(when)}
            </span>
            <span>{mins} min read</span>
            {post.tag && <span>{post.tag}</span>}
            {post.status === "draft" && <span style={{ color: "var(--ac)" }}>Draft</span>}
            {writable && <OwnerActions editHref={`/write?edit=${post.id}`} deleteUrl={`/api/posts/${post.id}`} afterDelete="/write" />}
          </div>
          <h1>{post.title || "Untitled"}</h1>
        </div>
        <div className="g12 read-body">
          <div className="c3 read-lede">{post.subtitle}</div>
          <div className="read-text">{renderBody(post.body)}</div>
        </div>
        {next && next.id !== post.id && (
          <div className="g12 read-next">
            <div className="c3">Next</div>
            <Link href={`/write/${next.slug}`}>
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
