import Link from "next/link";
import { site } from "@/content/site";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  let intro: string = site.intro;
  try {
    const saved = await (await getStore()).getProfile();
    if (saved?.intro) intro = saved.intro;
  } catch {
    /* keep the default */
  }
  return (
    <div className="landing">
      <div className="wordmark">{site.name}</div>
      <div className="landing-intro">{intro}</div>
      <nav className="landing-routes">
        {site.routes.map((r, i) => (
          <Link key={r.href} href={r.href} className="landing-route" style={{ animationDelay: `${200 + i * 90}ms` }}>
            {r.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
