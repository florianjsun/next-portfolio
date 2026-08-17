import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Formats a start/end date pair as a "2023 - 2025" (or "2023 - Present") range. */
export function getDurationText(
  startDate: Date,
  endDate: Date | "Present"
): string {
  const startYear = startDate.getUTCFullYear().toString();
  const endYear =
    typeof endDate === "string"
      ? "Present"
      : endDate.getUTCFullYear().toString();
  return `${startYear} - ${endYear}`;
}
