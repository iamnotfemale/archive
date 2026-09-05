import Link from "next/link";
import { notFound } from "next/navigation";
import Rail from "@/components/Rail";
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
    const store = await getStore();
    const post = await store.getPostBySlug(slug);
    if (!post || post.status !== "published") return { title: "write" };
    return { title: `${post.title || "제목 없음"} — write`, description: post.subtitle || excerpt(post.body) };
  } catch {
    return { title: "write" };
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore();
  const [post, writable] = await Promise.all([store.getPostBySlug(slug), canWrite()]);
  if (!post) notFound();
  if (post.status !== "published" && !writable) notFound();

  const all = await store.listPosts();
  const published = all.filter((p) => p.status === "published" && p.scope === "public");
  const idx = published.findIndex((p) => p.id === post.id);
  const next = idx >= 0 ? published[idx + 1] ?? null : null;
  const when = post.publishedAt ?? post.updatedAt;

  return (
    <div className="page">
      <Rail>
        <Link href="/write" className="side-sub rail-link">
          ← 글 목록
        </Link>
      </Rail>

      <div className="body">
        <div className="grid">
          <div className="month-label-col">
            <div className="month-label">{fullDate(when)}</div>
          </div>
          <article className="post">
            <h1 className="post-title">{post.title || "제목 없음"}</h1>
            {post.subtitle && <div className="post-subtitle">{post.subtitle}</div>}
            <div className="post-meta">
              {post.tag && <span>{post.tag}</span>}
              <span>{fullDate(when)}</span>
              {post.status === "draft" && <span>초안</span>}
              {post.status === "published" && post.scope === "unlisted" && <span>링크 있는 사람만</span>}
              {writable && <OwnerActions editHref={`/write?edit=${post.id}`} deleteUrl={`/api/posts/${post.id}`} afterDelete="/write" />}
            </div>
            <div className="post-body">{renderBody(post.body)}</div>
            {next && (
              <div className="post-next">
                <span className="pv-esc" style={{ cursor: "default" }}>
                  다음
                </span>
                <Link href={`/write/${next.slug}`} className="post-next-link">
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
