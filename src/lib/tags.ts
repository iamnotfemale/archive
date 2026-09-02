import type { Item } from "./types";

/** Distinct tags, most used first. Safe for client and server. */
export function distinctTags(items: Item[]): string[] {
  const count = new Map<string, number>();
  for (const it of items) if (it.tag) count.set(it.tag, (count.get(it.tag) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).map(([t]) => t);
}

/** Tags to offer beneath a tag field: everything except what is already typed exactly. */
export function suggestions(tags: string[], input: string): string[] {
  let q = input.trim().toLowerCase();
  if (tags.some((t) => t.toLowerCase() === q)) q = "";
  return tags.filter((t) => t.toLowerCase() !== input.trim().toLowerCase() && (!q || t.toLowerCase().includes(q)));
}
