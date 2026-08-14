interface ProjectDescriptionProps {
  paragraphs: string[];
  bullets: string[];
}

export default function ProjectDescription({
  paragraphs,
  bullets,
}: ProjectDescriptionProps) {
  return (
    <div>
      {paragraphs.map((paragraph, index) => (
        <p className="mb-4" key={index}>
          {paragraph}
        </p>
      ))}
      <ul className="list-disc pl-6 mt-4">
        {bullets.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}
