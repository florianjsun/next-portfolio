import "server-only";

import { z } from "zod";

import { siteConfig } from "@/config/site";
import { createRequestTimeoutSignal } from "@/lib/http";

const REVALIDATE_SECONDS = 60 * 60 * 6; // 6 hours

const repositoryStatsSchema = z.object({
  stargazers_count: z.number().int().nonnegative(),
});

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
        signal: createRequestTimeoutSignal(),
      }
    );

    if (!res.ok) return null;
    const data = repositoryStatsSchema.safeParse(await res.json());
    return data.success ? data.data.stargazers_count : null;
  } catch {
    return null;
  }
}
