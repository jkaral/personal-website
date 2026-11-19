import { redirect } from "next/navigation";

// this section now lives on a combined page
export default function Moved() {
  redirect("/identity#writing");
}
