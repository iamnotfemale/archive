import { redirect } from "next/navigation";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/write?edit=${id}`);
}
