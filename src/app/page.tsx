import Home from "@/components/Home";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let items: Item[] = [];
  let posts = 0;
  try {
    const store = await getStore();
    const [i, p] = await Promise.all([store.list(), store.listPosts()]);
    items = i;
    posts = p.filter((x) => x.status === "published" && x.scope === "public").length;
  } catch {
    /* empty archive */
  }
  const writable = await canWrite();
  return <Home items={items} posts={posts} writable={writable} locked={!writable} />;
}
