import PageContainer from "@/components/common/page-container";
import ContributionCard from "@/components/contributions/contribution-card";
import { pagesConfig } from "@/config/pages";
import { getGithubContributions } from "@/lib/github-contributions";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: pagesConfig.contributions.metadata.title,
  description: pagesConfig.contributions.metadata.description,
  path: "/contributions",
});

export default async function ContributionsPage() {
  const contributions = await getGithubContributions();

  return (
    <PageContainer
      title={pagesConfig.contributions.title}
      description={pagesConfig.contributions.description}
    >
      <ContributionCard contributions={contributions} />
    </PageContainer>
  );
}
