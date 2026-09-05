import Link from "next/link";
import Rail from "@/components/Rail";
import Works from "@/components/Works";
import PrintButton from "@/components/PrintButton";
import { site } from "@/content/site";
import { cv, works } from "@/content/portfolio";
import { getStore } from "@/lib/store";
import { dayLabel } from "@/lib/format";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: `portfolio — ${site.name}` };

export default async function PortfolioPage() {
  let posts: Post[] = [];
  try {
    const store = await getStore();
    posts = (await store.listPosts()).filter((p) => p.status === "published" && p.scope === "public").slice(0, 3);
  } catch {
    posts = [];
  }

  return (
    <div className="page cv">
      <Rail />
      <PrintButton />

      <div className="body cv-body">
        <div className="grid">
          <div />
          <div className="cv-intro">
            <div className="cv-lead">{site.intro}</div>
            <div className="cv-sub">{site.sub}</div>
          </div>
          <div />
        </div>

        {cv.map((b) => (
          <section key={b.label} className="grid cv-block">
            <div>
              <div className="cv-label">{b.label}</div>
            </div>
            <div>
              <div className="cv-line" />
              {b.rows.map((r, i) => (
                <div key={i} className="cv-row">
                  <span className="cv-title">{r.title}</span>
                  <span className="cv-sub-text">{r.sub}</span>
                  <span className="cv-when">{r.when}</span>
                </div>
              ))}
            </div>
            <div />
          </section>
        ))}

        <Works works={works} />

        <section className="grid cv-block">
          <div>
            <div className="cv-label">글</div>
          </div>
          <div>
            <div className="cv-line" />
            <div className="cv-note">
              작업의 근거는 대개{" "}
              <Link href="/write" className="cv-inline-link">
                /write
              </Link>{" "}
              에 먼저 씁니다.
            </div>
            {posts.map((p) => (
              <Link key={p.id} href={`/write/${p.slug}`} className="cv-row link">
                <span className="cv-title ellipsis">{p.title || "제목 없음"}</span>
                {p.tag && <span className="row-meta tagname">{p.tag}</span>}
                <span className="row-meta date">{dayLabel(p.publishedAt ?? p.updatedAt)}</span>
              </Link>
            ))}
          </div>
          <div />
        </section>

        <section className="grid cv-block">
          <div>
            <div className="cv-label">연락</div>
          </div>
          <div>
            <div className="cv-line" />
            <div className="cv-contacts">
              {site.contacts.map((c) => (
                <div key={c.label} className="cv-contact">
                  <span className="cv-contact-label">{c.label}</span>
                  <a href={c.href} target={c.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className="cv-contact-value">
                    {c.value}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div />
        </section>
      </div>
    </div>
  );
}
