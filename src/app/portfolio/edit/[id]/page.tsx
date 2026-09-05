import { notFound, redirect } from "next/navigation";
import WorkEditor from "@/components/WorkEditor";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "작업 쓰기 — portfolio" };

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await canWrite())) redirect("/portfolio");
  const { id } = await params;
  const store = await getStore();
  const [work, all] = await Promise.all([store.getWork(id), store.listWorks()]);
  if (!work) notFound();
  return <WorkEditor work={work} all={all} />;
}
