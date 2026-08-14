import PageContainer from "@/components/common/page-container";
import SkillsCard from "@/components/skills/skills-card";
import { pagesConfig } from "@/config/pages";
import { skills } from "@/config/skills";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: pagesConfig.skills.metadata.title,
  description: pagesConfig.skills.metadata.description,
  path: "/skills",
});

export default function SkillsPage() {
  return (
    <PageContainer
      title={pagesConfig.skills.title}
      description={pagesConfig.skills.description}
    >
      <SkillsCard skills={skills} />
    </PageContainer>
  );
}
