import site from "../../content/site";
import { HobbiesSection, WritingSection, InspirationsSection } from "../../components/sections";
import { getDuolingo, getFable } from "../../lib/live";

export const metadata = { title: "identity" };
export const revalidate = 21600; // rebuild with fresh Duolingo / Fable data (hobbies) every 6 hours

// "identity": hobbies, writing and "my mind" (the carousel) on one page. ("my why" is on the front page.)
export default async function IdentityPage() {
  const [duo, fable] = await Promise.all([getDuolingo(site.live?.duolingoUsername), getFable(site.live?.fableProfile)]);
  return (
    <>
      <HobbiesSection duo={duo} fable={fable} />
      <WritingSection />
      <InspirationsSection />
    </>
  );
}
