import type { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import ContributionCard from "@/components/contributions/contribution-card";
import { pagesConfig } from "@/config/pages";
import { getGithubContributions } from "@/lib/github-contributions";

export const metadata: Metadata = {
  title: pagesConfig.contributions.metadata.title,
  description: pagesConfig.contributions.metadata.description,
};

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
