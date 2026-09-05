import { notFound, redirect } from "next/navigation";
import Editor from "@/components/Editor";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "쓰기 — write" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await canWrite())) redirect("/write");
  const { id } = await params;
  const store = await getStore();
  const [post, all] = await Promise.all([store.getPost(id), store.listPosts()]);
  if (!post) notFound();
  const drafts = all.filter((p) => p.status === "draft");
  const tags = [...new Set(all.map((p) => p.tag).filter(Boolean))];
  return <Editor post={post} drafts={drafts} tags={tags} />;
}
