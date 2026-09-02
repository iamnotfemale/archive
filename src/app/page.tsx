import Archive from "@/components/Archive";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const store = await getStore();
  const [items, writable] = await Promise.all([store.list(), canWrite()]);
  return <Archive initialItems={items} locked={!writable} />;
}
