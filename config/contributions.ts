export interface ContributionsInterface {
  repo: string;
  contributionDescription: string;
  repoOwner: string;
  link: string;
}

export const contributionsUnsorted: ContributionsInterface[] = [
  {
    repo: "minimal-next-portfolio",
    contributionDescription:
      "Open-source Next.js portfolio template. Trusted and forked by developers worldwide (130+ GitHub stars).",
    repoOwner: "namanbarkiya",
    link: "https://github.com/namanbarkiya/minimal-next-portfolio",
  },
  {
    repo: "niya-saas-template",
    contributionDescription:
      "Modern Next.js SaaS template. Production-ready starter for devs and AI startups (30+ GitHub stars).",
    repoOwner: "namanbarkiya",
    link: "https://github.com/namanbarkiya/niya-saas-template",
  },
  {
    repo: "autogen",
    contributionDescription:
      "Improved the gallery component to showcase the community work.",
    repoOwner: "Microsoft",
    link: "https://github.com/microsoft/autogen/pull/1445",
  },
  {
    repo: "creativecommons",
    contributionDescription:
      "Closed Issue: Fixed navbar issue on the main website of creative common.",
    repoOwner: "Creative Commons",
    link: "https://github.com/creativecommons/creativecommons.github.io-source/pull/738",
  },
  {
    repo: "creativecommons",
    contributionDescription:
      "Added section for 'Other Opportunities' on main page.",
    repoOwner: "Creative Commons",
    link: "https://github.com/creativecommons/creativecommons.github.io-source/pull/719",
  },
];

export const featuredContributions: ContributionsInterface[] =
  contributionsUnsorted.slice(0, 3);
