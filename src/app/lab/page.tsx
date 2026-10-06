import Lab from "@/components/Lab";
import { canWrite } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "lab" };

export default async function LabPage() {
  return <Lab writable={await canWrite()} />;
}
