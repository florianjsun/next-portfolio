import { isHttpsUrl, isSiteRelativeUrl } from "@/lib/content-urls";

export function isExternalUrl(value: string): boolean {
  return isHttpsUrl(value);
}

export function toAbsoluteUrl(value: string, baseUrl: string): string {
  if (isExternalUrl(value)) {
    return value;
  }

  if (!isSiteRelativeUrl(value)) {
    throw new Error("URL must be site-relative or HTTPS");
  }

  return new URL(value, baseUrl).toString();
}
