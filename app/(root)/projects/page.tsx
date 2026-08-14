import PageContainer from "@/components/common/page-container";
import ProjectCard from "@/components/projects/project-card";
import { ProjectFilter } from "@/components/projects/project-filter";
import { pagesConfig } from "@/config/pages";
import { projects } from "@/config/projects";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: pagesConfig.projects.metadata.title,
  description: pagesConfig.projects.metadata.description,
  path: "/projects",
});

export default function ProjectsPage() {
  const projectItems = projects.map((project, index) => ({
    id: project.id,
    type: project.type,
    content: (
      <ProjectCard
        project={project}
        eagerLoadImage={index === 0}
        key={project.id}
      />
    ),
  }));

  return (
    <PageContainer
      title={pagesConfig.projects.title}
      description={pagesConfig.projects.description}
    >
      <ProjectFilter items={projectItems} />
    </PageContainer>
  );
}
