export type ContributionType = "repository" | "pull-request";

interface ContributionBase {
  id: string;
  type: ContributionType;
  repo: string;
  contributionDescription: string;
  repoOwner: string;
  link: string;
  updatedAt: string;
}

export interface RepositoryContribution extends ContributionBase {
  type: "repository";
  stars: number;
  language: string | null;
  isFork: boolean;
  archived: boolean;
}

export interface PullRequestContribution extends ContributionBase {
  type: "pull-request";
  number: number;
  status: "open" | "closed" | "merged";
}

export type Contribution = RepositoryContribution | PullRequestContribution;

export const contributionsConfig = {
  featuredLimit: 3,
  featuredRepositoryLimit: 2,
  pullRequestLimit: 10,
  revalidateSeconds: 60 * 60 * 6,
} as const;
