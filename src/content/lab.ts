/** Lab: small tools, one subdomain each. Edit this list to add or remove entries. */
export interface LabItem {
  name: string; // short name shown big in the preview tile
  title: string;
  desc: string;
  host: string; // subdomain; the link is https://{host}
  date: string; // YYYY.MM
  stack: string;
  built: string; // "one evening"
}

export const lab: LabItem[] = [
  { name: "100test", title: "100 questions, one timer", desc: "Mock-exam pacing: 100 questions, a single countdown, nothing else on screen.", host: "100test.yeoziphab.com", date: "2026.10", stack: "Next.js · Supabase", built: "one evening" },
  { name: "jamo", title: "Hangul, taken apart", desc: "Paste a sentence and watch every syllable split into initial, medial, final.", host: "jamo.yeoziphab.com", date: "2026.09", stack: "Vite · Rust/WASM", built: "two days" },
  { name: "dither", title: "Bayer dither for any image", desc: "Drop a photo, get the 1-bit dithered version this site uses as decoration.", host: "dither.yeoziphab.com", date: "2026.09", stack: "Canvas · no backend", built: "one afternoon" },
  { name: "readlater", title: "Read later, but dated", desc: "A reading list that expires: links vanish after 30 days unless opened.", host: "readlater.yeoziphab.com", date: "2026.08", stack: "SvelteKit · SQLite", built: "three days" },
  { name: "grid", title: "Twelve-column overlay", desc: "A bookmarklet that draws this site's grid over whatever page you're on.", host: "grid.yeoziphab.com", date: "2026.07", stack: "Vanilla JS", built: "one hour" },
  { name: "clock", title: "Seoul, right now", desc: "A full-screen clock and sun angle for exactly one city.", host: "clock.yeoziphab.com", date: "2026.06", stack: "Astro", built: "one evening" },
];
