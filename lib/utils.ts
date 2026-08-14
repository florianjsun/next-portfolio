import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats a start/end date pair as a "2023 - 2025" (or "2023 - Present") range. */
export function getDurationText(
  startDate: Date,
  endDate: Date | "Present"
): string {
  const startYear = new Date(startDate).getFullYear().toString();
  const endYear =
    typeof endDate === "string"
      ? "Present"
      : new Date(endDate).getFullYear().toString();
  return `${startYear} - ${endYear}`;
}
