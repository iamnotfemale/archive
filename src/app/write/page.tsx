import WriteList from "@/components/WriteList";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { lab as labSeed } from "@/content/lab";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "writing" };

export default async function WritePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const writable = await canWrite();
  let posts: Post[] = [];
  let items = 0;
  let labs = labSeed.length;
  try {
    const store = await getStore();
    items = (await store.list()).length;
    labs = ((await store.getLab()) ?? labSeed).length;
    const all = await store.listPosts();
    posts = writable ? all : all.filter((p) => p.status === "published" && p.scope === "public");
  } catch {
    posts = [];
  }
  return <WriteList posts={posts} items={items} labs={labs} writable={writable} editId={edit ?? null} />;
}
