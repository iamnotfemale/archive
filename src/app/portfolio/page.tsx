import Rail from "@/components/Rail";
import Cv from "@/components/Cv";
import { site } from "@/content/site";
import { defaultProfile } from "@/content/profile";
import { canWrite } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { Profile, Work } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: `portfolio — ${site.name}` };

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const writable = await canWrite();
  let works: Work[] = [];
  let profile: Profile = defaultProfile();
  try {
    const store = await getStore();
    const [all, saved] = await Promise.all([store.listWorks(), store.getProfile()]);
    works = writable ? all : all.filter((w) => w.status === "published");
    if (saved) profile = saved;
  } catch {
    works = [];
  }

  return (
    <div className="page cv">
      <Rail />
      <div className="body cv-body">
        <Cv profile={profile} works={works} writable={writable} editId={edit ?? null} />
      </div>
    </div>
  );
}
