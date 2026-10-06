import { site } from "@/content/site";

export default function Footer() {
  const gh = site.contacts.find((c) => c.href.includes("github"));
  const mail = site.contacts.find((c) => c.href.startsWith("mailto:"));
  return (
    <footer className="foot g12">
      <div className="c3">
        {site.name} © {new Date().getFullYear()}
      </div>
      <div style={{ gridColumn: "4 / span 5" }}>Built by hand · No tracking</div>
      <div className="links">
        {gh && (
          <a href={gh.href} target="_blank" rel="noreferrer">
            GitHub
          </a>
        )}
        {mail && <a href={mail.href}>Mail</a>}
        <a href="https://yeoziphab.com" target="_blank" rel="noreferrer">
          yeoziphab.com ↗
        </a>
        <a href="#top">Top ↑</a>
      </div>
    </footer>
  );
}
