import Link from "next/link";
import { site } from "@/content/site";

export default function Home() {
  return (
    <div className="landing">
      <div className="wordmark">{site.name}</div>
      <div className="landing-intro">{site.intro}</div>
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
