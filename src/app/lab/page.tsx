import { redirect } from "next/navigation";

/** Labs live on the studio site now (edited there); this old address forwards. */
export default function LabPage() {
  redirect("https://yeoziphab.com/labs");
}
