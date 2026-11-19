import site from "../../content/site";
import { HobbiesSection } from "../../components/sections";
import { getDuolingo, getFable } from "../../lib/live";

export const metadata = { title: "Hobbies" };
export const revalidate = 21600; // rebuild with fresh Duolingo / Fable data every 6 hours

export default async function HobbiesPage() {
  const [duo, fable] = await Promise.all([getDuolingo(site.live?.duolingoUsername), getFable(site.live?.fableProfile)]);
  return <HobbiesSection duo={duo} fable={fable} />;
}
