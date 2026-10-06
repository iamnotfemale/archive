import Lab from "@/components/Lab";
import { lab as seed } from "@/content/lab";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "lab" };

export default async function LabPage() {
  const writable = await canWrite();
  let items = seed;
  let archive = 0;
  let posts = 0;
  try {
    const store = await getStore();
    items = (await store.getLab()) ?? seed;
    archive = (await store.list()).length;
    posts = (await store.listPosts()).filter((p) => p.status === "published" && p.scope === "public").length;
  } catch {
    /* seed */
  }
  return <Lab items={items} writable={writable} archive={archive} posts={posts} />;
}
