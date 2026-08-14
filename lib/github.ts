import { siteConfig } from "@/config/site";

const REVALIDATE_SECONDS = 60 * 60 * 6; // 6 hours

/** Extracts the "owner/repo" slug from the configured template repo URL. */
export function getTemplateRepoSlug(): string {
  const url = new URL(siteConfig.links.templateRepo);
  return url.pathname.replace(/^\/+/, "").replace(/\.git$/, "");
}

/** Fetches the template repo star count, cached and revalidated every 6 hours. */
export async function getTemplateRepoStars(): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${getTemplateRepoSlug()}`,
      {
        next: { revalidate: REVALIDATE_SECONDS },
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}
