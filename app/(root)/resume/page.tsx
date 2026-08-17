import { notFound, redirect } from "next/navigation";

function getSafeResumeUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || !url.hostname) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export default function ResumePage() {
  const resumeUrl = getSafeResumeUrl(process.env.NEXT_PUBLIC_RESUME_LINK);
  if (!resumeUrl) {
    notFound();
  }

  redirect(resumeUrl);
}
