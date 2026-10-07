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
  { name: "gradient", title: "Two words, one chain between", desc: "A daily word game: link word to word until the first word becomes the last.", host: "gradient.yeoziphab.com", date: "2026.10", stack: "Next.js · Numberbatch", built: "one day" },
];
