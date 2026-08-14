import Image from "next/image";
import Link from "next/link";

import { Icons } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import ChipContainer from "@/components/ui/chip-container";
import type { ProjectInterface } from "@/config/projects";

interface ProjectCardProps {
  project: ProjectInterface;
  eagerLoadImage?: boolean;
}

export default function ProjectCard({
  project,
  eagerLoadImage = false,
}: ProjectCardProps) {
  return (
    <div className="relative p-6 w-full bg-background border border-border rounded-lg h-full flex flex-col">
      <div className="relative w-full h-[200px] flex-shrink-0">
        <Image
          className="rounded-lg border border-border bg-muted object-contain"
          src={project.companyLogoImg}
          alt={project.companyName}
          fill
          loading={eagerLoadImage ? "eager" : "lazy"}
          sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
        />
      </div>
      <div className="pt-5 space-y-3 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          {project.companyName}
        </h3>
        <p className="line-clamp-3 font-normal text-muted-foreground flex-grow">
          {project.shortDescription}
        </p>
        <div className="flex gap-2 flex-wrap">
          <ChipContainer textArr={project.category} />
        </div>
        <div className="mt-auto">
          <Button variant="default" className="mt-2 w-full sm:w-auto" asChild>
            <Link href={`/projects/${project.id}`}>
              Read more
              <Icons.chevronRight className="w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 p-3 rounded-full bg-background border border-border hidden md:block">
        {project.type === "Personal" ? (
          <Icons.userFill className="h-4 w-4" />
        ) : (
          <Icons.work className="h-4 w-4" />
        )}
      </div>
    </div>
  );
}
