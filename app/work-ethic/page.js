import site from "../../content/site";
import ContributionGraph from "../../components/ContributionGraph";
import UsesBubble from "../../components/UsesBubble";
import { WhyContent, WorkSection, ProjectsSection, AwardsSection } from "../../components/sections";
import { getGitHubContributions } from "../../lib/live";

export const metadata = { title: "work ethic" };
export const revalidate = 21600; // rebuild with fresh GitHub data every 6 hours

// "work ethic": at the top, "my why" (the quote + what it means to me) beside GitHub activity, with the
// Uses bubble under them; then experience, projects and awards.
export default async function WorkEthicPage() {
  const contrib = await getGitHubContributions(site.live?.githubUsername);
  return (
    <>
      <section id="github" className="section reveal">
        <div className="container">
          <div className="ethic-top">
            <WhyContent />
            <div className="ethic-github">
              <ContributionGraph data={contrib} username={site.live?.githubUsername} showFrom={site.live?.githubShowFrom} trimUntil={site.live?.githubTrimUntil} />
            </div>
          </div>
          <div className="ethic-uses">
            <UsesBubble intro={site.uses.intro} groups={site.uses.groups} />
          </div>
        </div>
      </section>
      <WorkSection />
      <ProjectsSection />
      <AwardsSection />
    </>
  );
}
