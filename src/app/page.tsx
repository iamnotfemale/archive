import Archive from "@/components/Archive";
import { canWrite } from "@/lib/auth";
import { getStore, StoreError } from "@/lib/store";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let items: Item[] = [];
  let dbError: string | null = null;
  try {
    const store = await getStore();
    items = await store.list();
  } catch (e) {
    dbError = e instanceof StoreError ? e.code : "db_failed";
  }
  const writable = await canWrite();
  return <Archive initialItems={items} locked={!writable} dbError={dbError} />;
}
