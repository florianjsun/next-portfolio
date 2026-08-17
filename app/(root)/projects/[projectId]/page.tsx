import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icons } from "@/components/common/icons";
import ProjectDescription from "@/components/projects/project-description";
import { buttonVariants } from "@/components/ui/button";
import ChipContainer from "@/components/ui/chip-container";
import CustomTooltip from "@/components/ui/custom-tooltip";
import { projects } from "@/config/projects";
import { siteConfig } from "@/config/site";
import { createPageMetadata } from "@/lib/metadata";
import { cn, formatDate } from "@/lib/utils";
import profileImg from "@/public/profile-img.jpg";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ projectId: project.id }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = projects.find((project) => project.id === projectId);

  if (!project) {
    return {
      title: "Project Not Found",
      robots: { index: false, follow: false },
    };
  }

  return createPageMetadata({
    title: project.companyName,
    description: project.shortDescription,
    path: `/projects/${project.id}`,
  });
}

export default async function Project({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = projects.find((project) => project.id === projectId);
  if (!project) {
    notFound();
  }

  return (
    <article className="container relative max-w-3xl py-6 lg:py-10">
      <Link
        href="/projects"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-[-200px] top-14 hidden xl:inline-flex"
        )}
      >
        <Icons.chevronLeft className="mr-2 h-4 w-4" />
        All Projects
      </Link>
      <div>
        <time
          dateTime={project.startDate.toISOString()}
          className="block text-sm text-muted-foreground"
        >
          {formatDate(project.startDate)}
        </time>
        <h1 className="flex items-center justify-between mt-2 font-heading text-4xl leading-tight lg:text-5xl">
          {project.companyName}
          <span className="flex items-center">
            {project.githubLink && (
              <CustomTooltip text="Link to the source code.">
                <Link
                  href={project.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${project.companyName} source code`}
                >
                  <Icons.gitHub className="w-6 ml-4 text-muted-foreground hover:text-foreground" />
                </Link>
              </CustomTooltip>
            )}
            {project.websiteLink && (
              <CustomTooltip text="Please note that some project links may be temporarily unavailable.">
                <Link
                  href={project.websiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${project.companyName} website`}
                >
                  <Icons.externalLink className="w-6 ml-4 text-muted-foreground hover:text-foreground " />
                </Link>
              </CustomTooltip>
            )}
          </span>
        </h1>
        <ChipContainer textArr={project.category} />
        <div className="mt-4 flex space-x-4">
          <Link
            href={siteConfig.links.github}
            className="flex items-center space-x-2 text-sm"
          >
            <Image
              src={profileImg}
              alt={siteConfig.username}
              width={42}
              height={42}
              className="rounded-full bg-background"
            />

            <div className="flex-1 text-left leading-tight">
              <p className="font-medium">{siteConfig.authorName}</p>
              <p className="text-[12px] text-muted-foreground">
                @{siteConfig.username}
              </p>
            </div>
          </Link>
        </div>
      </div>

      <Image
        src={project.companyLogoImg}
        alt={project.companyName}
        width={720}
        height={405}
        className="my-8 h-auto w-full rounded-md border bg-muted object-contain transition-colors"
        preload
      />

      <div className="mb-7 ">
        <h2 className="inline-block font-heading text-3xl leading-tight lg:text-3xl mb-2">
          技术栈
        </h2>
        <ChipContainer textArr={project.techStack} />
      </div>

      <div className="mb-7 ">
        <h2 className="inline-block font-heading text-3xl leading-tight lg:text-3xl mb-2">
          项目描述
        </h2>
        <ProjectDescription
          paragraphs={project.descriptionDetails.paragraphs}
          bullets={project.descriptionDetails.bullets}
        />
      </div>

      <div className="mb-7 ">
        <h2 className="inline-block font-heading text-3xl leading-tight lg:text-3xl mb-5">
          页面信息
        </h2>
        {project.pagesInfoArr.map((page) => (
          <section className="mb-10 last:mb-0" key={page.title}>
            <h3 className="flex items-center font-heading text-xl leading-tight lg:text-xl mt-3">
              <Icons.star className="h-5 w-5 mr-2" /> {page.title}
            </h3>
            <p>{page.description}</p>
            {page.source && (
              <p className="mt-2 text-sm text-muted-foreground">
                图片来源：
                <Link
                  className="underline underline-offset-4 hover:text-foreground"
                  href={page.source.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {page.source.label}
                </Link>
              </p>
            )}
            <div
              className={cn(
                "mt-4 grid min-w-0 gap-4",
                page.layout === "grid"
                  ? "sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {page.images.map((image) => (
                <figure
                  className={cn(
                    "min-w-0",
                    image.display === "compact" && "mx-auto w-full max-w-sm"
                  )}
                  key={image.src}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    sizes={
                      page.layout === "grid"
                        ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 240px"
                        : "(max-width: 768px) 100vw, 720px"
                    }
                    className="h-auto w-full rounded-md border bg-muted object-contain transition-colors"
                  />
                  <figcaption className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {image.alt}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>

      <hr className="mt-12" />
      <div className="flex justify-center py-6 lg:py-10">
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          All Projects
        </Link>
      </div>
    </article>
  );
}
