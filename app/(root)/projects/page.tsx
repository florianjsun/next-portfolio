import type { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import ProjectCard from "@/components/projects/project-card";
import { ResponsiveTabs } from "@/components/ui/responsive-tabs";
import { pagesConfig } from "@/config/pages";
import { projects } from "@/config/projects";

export const metadata: Metadata = {
  title: pagesConfig.projects.metadata.title,
  description: pagesConfig.projects.metadata.description,
};

const renderContent = (tabVal: string) => {
  let projectArr = projects;
  if (tabVal === "personal") {
    projectArr = projectArr.filter((project) => project.type === "Personal");
  } else if (tabVal === "professional") {
    projectArr = projectArr.filter(
      (project) => project.type === "Professional"
    );
  }

  return (
    <div className="mx-auto my-4 grid justify-center gap-4 sm:grid-cols-2 xl:grid-cols-4 static items-stretch">
      {projectArr.map((project, index) => (
        <ProjectCard
          project={project}
          eagerLoadImage={tabVal === "all" && index === 0}
          key={project.id}
        />
      ))}
    </div>
  );
};

export default function ProjectsPage() {
  const tabItems = [
    {
      value: "all",
      label: "All",
      content: renderContent("all"),
    },
    {
      value: "personal",
      label: "Personal",
      content: renderContent("personal"),
    },
    {
      value: "professional",
      label: "Professional",
      content: renderContent("professional"),
    },
  ];

  return (
    <PageContainer
      title={pagesConfig.projects.title}
      description={pagesConfig.projects.description}
    >
      <ResponsiveTabs items={tabItems} defaultValue="all" />
    </PageContainer>
  );
}
