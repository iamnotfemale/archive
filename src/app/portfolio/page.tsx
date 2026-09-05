import Rail from "@/components/Rail";
import PortfolioWorks from "@/components/PortfolioWorks";
import { site } from "@/content/site";
import { cv } from "@/content/portfolio";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { Work } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: `portfolio — ${site.name}` };

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const writable = await canWrite();
  let works: Work[] = [];
  try {
    const store = await getStore();
    const all = await store.listWorks();
    works = writable ? all : all.filter((w) => w.status === "published");
  } catch {
    works = [];
  }

  return (
    <div className="page cv">
      <Rail />

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

        <PortfolioWorks works={works} writable={writable} editId={edit ?? null} />

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
