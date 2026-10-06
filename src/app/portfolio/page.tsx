import { redirect } from "next/navigation";

export default async function PortfolioRedirect({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  redirect(edit ? `/?edit=${edit}` : "/");
}
