import { WhySection, InspirationsSection } from "../../components/sections";

export const metadata = { title: "my mind" };

// "my mind": "my why" (the quote + what it means to me), then the carousel (and gallery)
// of the people, art and things that shape how I think
export default function MyMindPage() {
  return (
    <>
      <WhySection />
      <InspirationsSection />
    </>
  );
}
