import { Suspense } from "react";
import SaveWindow from "@/components/SaveWindow";

export const dynamic = "force-dynamic";

export const metadata = { title: "남기기 — archive" };

export default function AddPage() {
  return (
    <Suspense fallback={null}>
      <SaveWindow />
    </Suspense>
  );
}
