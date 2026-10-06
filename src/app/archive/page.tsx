import Home from "@/components/Home";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { lab as labSeed } from "@/content/lab";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let items: Item[] = [];
  let posts = 0;
  let labs = labSeed.length;
  try {
    const store = await getStore();
    const [i, p, l] = await Promise.all([store.list(), store.listPosts(), store.getLab()]);
    items = i;
    labs = (l ?? labSeed).length;
    posts = p.filter((x) => x.status === "published" && x.scope === "public").length;
  } catch {
    /* empty archive */
  }
  const writable = await canWrite();
  return <Home items={items} posts={posts} labs={labs} writable={writable} locked={!writable} />;
}
