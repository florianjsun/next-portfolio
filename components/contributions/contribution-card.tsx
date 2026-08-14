import Link from "next/link";

import { Icons } from "@/components/common/icons";
import type { Contribution } from "@/config/contributions";

interface ContributionCardProps {
  contributions: Contribution[];
}

const pullRequestStatusLabel = {
  open: "开放",
  closed: "已关闭",
  merged: "已合并",
} as const;

export default function ContributionCard({
  contributions,
}: ContributionCardProps) {
  if (contributions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center">
        <Icons.gitHub className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">暂时还没有公开的开源贡献</p>
        <p className="mt-2 text-sm text-muted-foreground">
          公开仓库或向其他项目提交的 PR 会自动显示在这里。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
      {contributions.map((contribution) => (
        <Link
          href={contribution.link}
          target="_blank"
          rel="noreferrer"
          key={contribution.id}
          className="w-full min-w-0 h-full"
        >
          <div className="relative rounded-lg border bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors w-full h-full flex flex-col">
            <Icons.externalLink
              size={35}
              className="absolute bottom-3 right-3 border bg-background rounded-full p-1.5 sm:p-2 cursor-pointer text-muted-foreground z-10 w-8 h-8 sm:w-10 sm:h-10"
            />
            <div className="flex min-h-[170px] flex-col justify-between rounded-md p-4 sm:p-6 pb-12 sm:pb-6 flex-grow">
              <div className="flex flex-row justify-between items-start gap-2 mb-4 min-w-0">
                <h3 className="font-bold flex space-x-2 items-center min-w-0 flex-1">
                  <Icons.gitRepoIcon
                    size={18}
                    className="flex-shrink-0 sm:w-5 sm:h-5"
                  />
                  <span className="truncate text-sm sm:text-base min-w-0">
                    {contribution.repo}
                  </span>
                </h3>
                <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
                  {contribution.type === "repository"
                    ? contribution.archived
                      ? "已归档仓库"
                      : contribution.isFork
                        ? "Fork 仓库"
                        : "开源仓库"
                    : `PR #${contribution.number}`}
                </span>
              </div>
              <div className="space-y-3 sm:space-y-4 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 break-words">
                  {contribution.contributionDescription}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground flex space-x-2 items-center min-w-0">
                  <Icons.gitOrgBuilding
                    size={14}
                    className="flex-shrink-0 sm:w-4 sm:h-4"
                  />
                  <span className="truncate min-w-0">
                    {contribution.repoOwner}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {contribution.type === "repository" ? (
                    <>
                      {contribution.language || "多语言"} · {contribution.stars}{" "}
                      Stars
                    </>
                  ) : (
                    pullRequestStatusLabel[contribution.status]
                  )}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
