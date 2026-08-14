import "server-only";

import { z } from "zod";

import {
  Contribution,
  contributionsConfig,
  PullRequestContribution,
  RepositoryContribution,
} from "@/config/contributions";
import { siteConfig } from "@/config/site";

const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_API_URL = "https://api.github.com";

const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  fork: z.boolean(),
  archived: z.boolean(),
  stargazers_count: z.number(),
  language: z.string().nullable(),
  updated_at: z.string(),
  owner: z.object({
    login: z.string(),
  }),
});

const pullRequestSearchSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      number: z.number(),
      title: z.string(),
      html_url: z.string().url(),
      repository_url: z.string().url(),
      state: z.enum(["open", "closed"]),
      updated_at: z.string(),
      pull_request: z.object({
        merged_at: z.string().nullable(),
      }),
    })
  ),
});

type GitHubRepository = z.infer<typeof repositorySchema>;
type GitHubPullRequest = z.infer<
  typeof pullRequestSearchSchema
>["items"][number];

function getGitHubUsername(): string {
  return process.env.GITHUB_USERNAME?.trim() || siteConfig.username;
}

function getGitHubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim();

  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "next-portfolio",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchGitHub(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    cache: "force-cache",
    headers: getGitHubHeaders(),
    next: { revalidate: contributionsConfig.revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API returned ${response.status} for ${url.pathname}`
    );
  }

  return response.json();
}

function mapRepository(repository: GitHubRepository): RepositoryContribution {
  return {
    id: `repository-${repository.id}`,
    type: "repository",
    repo: repository.name,
    contributionDescription:
      repository.description || "在 GitHub 上维护的公开开源项目。",
    repoOwner: repository.owner.login,
    link: repository.html_url,
    updatedAt: repository.updated_at,
    stars: repository.stargazers_count,
    language: repository.language,
    isFork: repository.fork,
    archived: repository.archived,
  };
}

function getRepositoryIdentity(repositoryUrl: string): {
  owner: string;
  repo: string;
} {
  const segments = new URL(repositoryUrl).pathname.split("/").filter(Boolean);
  const [owner = "GitHub", repo = "Repository"] = segments.slice(-2);
  return { owner, repo };
}

function mapPullRequest(
  pullRequest: GitHubPullRequest
): PullRequestContribution {
  const repository = getRepositoryIdentity(pullRequest.repository_url);

  return {
    id: `pull-request-${pullRequest.id}`,
    type: "pull-request",
    repo: repository.repo,
    contributionDescription: pullRequest.title,
    repoOwner: repository.owner,
    link: pullRequest.html_url,
    updatedAt: pullRequest.updated_at,
    number: pullRequest.number,
    status: pullRequest.pull_request.merged_at ? "merged" : pullRequest.state,
  };
}

async function getPublicRepositories(
  username: string
): Promise<RepositoryContribution[]> {
  const url = new URL(`/users/${username}/repos`, GITHUB_API_URL);
  url.searchParams.set("type", "owner");
  url.searchParams.set("sort", "updated");
  url.searchParams.set("per_page", "100");

  const repositories = z.array(repositorySchema).parse(await fetchGitHub(url));

  return repositories
    .sort(
      (first, second) =>
        second.stargazers_count - first.stargazers_count ||
        Date.parse(second.updated_at) - Date.parse(first.updated_at)
    )
    .map(mapRepository);
}

async function getPublicPullRequests(
  username: string
): Promise<PullRequestContribution[]> {
  const url = new URL("/search/issues", GITHUB_API_URL);
  url.searchParams.set(
    "q",
    `is:pr is:public author:${username} -user:${username}`
  );
  url.searchParams.set("sort", "updated");
  url.searchParams.set("order", "desc");
  url.searchParams.set(
    "per_page",
    contributionsConfig.pullRequestLimit.toString()
  );

  const result = pullRequestSearchSchema.parse(await fetchGitHub(url));
  return result.items.map(mapPullRequest);
}

async function getOrLogEmpty<T>(
  label: string,
  request: Promise<T[]>
): Promise<T[]> {
  try {
    return await request;
  } catch (error) {
    console.error(`Unable to load GitHub ${label}`, error);
    return [];
  }
}

export async function getGithubContributions(): Promise<Contribution[]> {
  const username = getGitHubUsername();
  const [repositories, pullRequests] = await Promise.all([
    getOrLogEmpty("repositories", getPublicRepositories(username)),
    getOrLogEmpty("pull requests", getPublicPullRequests(username)),
  ]);

  return [...repositories, ...pullRequests];
}

export async function getFeaturedGithubContributions(): Promise<
  Contribution[]
> {
  const contributions = await getGithubContributions();
  const repositories = contributions.filter(
    (contribution) => contribution.type === "repository"
  );
  const pullRequests = contributions.filter(
    (contribution) => contribution.type === "pull-request"
  );
  const preferredRepositories = [
    ...repositories.filter(
      (repository) => !repository.isFork && !repository.archived
    ),
    ...repositories.filter(
      (repository) => repository.isFork || repository.archived
    ),
  ];
  const featuredRepositories = preferredRepositories.slice(
    0,
    contributionsConfig.featuredRepositoryLimit
  );
  const featuredPullRequests = pullRequests.slice(
    0,
    contributionsConfig.featuredLimit - featuredRepositories.length
  );
  const remainingSlots =
    contributionsConfig.featuredLimit -
    featuredRepositories.length -
    featuredPullRequests.length;

  return [
    ...featuredRepositories,
    ...featuredPullRequests,
    ...preferredRepositories.slice(
      featuredRepositories.length,
      featuredRepositories.length + remainingSlots
    ),
  ];
}
