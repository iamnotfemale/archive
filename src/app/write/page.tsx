import WriteList from "@/components/WriteList";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "write" };

export default async function WritePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const writable = await canWrite();
  let posts: Post[] = [];
  try {
    const store = await getStore();
    const all = await store.listPosts();
    posts = writable ? all : all.filter((p) => p.status === "published" && p.scope === "public");
  } catch {
    posts = [];
  }
  return <WriteList posts={posts} writable={writable} editId={edit ?? null} />;
}
