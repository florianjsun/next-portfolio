import "server-only";

import { siteConfig } from "@/config/site";
import type { ContactFormValues } from "@/lib/contact";
import { createRequestTimeoutSignal } from "@/lib/http";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentSubmissions = new Map<string, number[]>();

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

type GoogleFormConfig = {
  formLink: string;
  fieldIdName: string;
  fieldIdEmail: string;
  fieldIdMessage: string;
  fieldIdSocial: string;
};

function getFormSubmitId(): string | null {
  const id = process.env.FORMSUBMIT_ID?.trim();
  return id || null;
}

function isLocalDevOrigin(origin: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  return LOCAL_DEV_HOSTS.has(host);
}

function readTrustedOrigin(value: string): string | null {
  try {
    const origin = new URL(value).origin;
    return origin === "null" ? null : origin;
  } catch {
    return null;
  }
}

export function isAllowedContactOrigin(request: Request): boolean {
  const originHeader = request.headers.get("origin")?.trim();
  const refererHeader = request.headers.get("referer")?.trim();
  const rawOrigin = originHeader || refererHeader;
  if (!rawOrigin) return false;

  const requestOrigin = readTrustedOrigin(rawOrigin);
  if (!requestOrigin) return false;

  let siteOrigin: string;
  try {
    siteOrigin = new URL(siteConfig.url).origin;
  } catch {
    siteOrigin = siteConfig.url;
  }

  return requestOrigin === siteOrigin || isLocalDevOrigin(requestOrigin);
}

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

export function resetContactRateLimits(): void {
  recentSubmissions.clear();
}

export function getContactRateLimitSize(): number {
  return recentSubmissions.size;
}

function pruneContactRateLimits(now: number): void {
  for (const [ip, timestamps] of recentSubmissions) {
    const recent = timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    if (recent.length === 0) {
      recentSubmissions.delete(ip);
    } else if (recent.length !== timestamps.length) {
      recentSubmissions.set(ip, recent);
    }
  }
}

export function isContactRateLimited(ip: string, now = Date.now()): boolean {
  pruneContactRateLimits(now);

  const recent = recentSubmissions.get(ip) ?? [];
  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  recentSubmissions.set(ip, recent);
  return false;
}

export function readHoneypot(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("website" in payload)) {
    return "";
  }

  const value = (payload as { website?: unknown }).website;
  return typeof value === "string" ? value : "";
}

export function stripHoneypot(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || !("website" in payload)) {
    return payload;
  }

  const rest = { ...(payload as Record<string, unknown>) };
  delete rest.website;
  return rest;
}

export function toGoogleFormResponseUrl(formLink: string): string {
  const url = new URL(formLink);
  url.search = "";
  url.hash = "";

  let path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/viewform")) {
    path = `${path.slice(0, -"/viewform".length)}/formResponse`;
  } else if (!path.endsWith("/formResponse")) {
    path = `${path}/formResponse`;
  }

  url.pathname = path;
  return url.toString();
}

function getGoogleFormConfig(): GoogleFormConfig | null {
  const formLink = process.env.GOOGLE_FORM_LINK?.trim();
  const fieldIdName = process.env.GOOGLE_FORM_FIELD_ID_NAME?.trim();
  const fieldIdEmail = process.env.GOOGLE_FORM_FIELD_ID_EMAIL?.trim();
  const fieldIdMessage = process.env.GOOGLE_FORM_FIELD_ID_MESSAGE?.trim();
  const fieldIdSocial = process.env.GOOGLE_FORM_FIELD_ID_SOCIAL?.trim();

  if (
    !formLink ||
    !fieldIdName ||
    !fieldIdEmail ||
    !fieldIdMessage ||
    !fieldIdSocial
  ) {
    return null;
  }

  return {
    formLink,
    fieldIdName,
    fieldIdEmail,
    fieldIdMessage,
    fieldIdSocial,
  };
}

async function readJsonObject(
  response: Response
): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  try {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== "object") return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTruthySuccess(value: unknown): boolean {
  return value === true || value === "true";
}

export function isSuccessfulGoogleFormResponse(response: {
  ok: boolean;
  status: number;
}): boolean {
  return response.ok || response.status === 302 || response.status === 303;
}

async function deliverViaGoogleForm(
  values: ContactFormValues,
  config: GoogleFormConfig
): Promise<void> {
  const response = await fetch(toGoogleFormResponseUrl(config.formLink), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      [config.fieldIdName]: values.name,
      [config.fieldIdEmail]: values.email,
      [config.fieldIdMessage]: values.message,
      [config.fieldIdSocial]: values.social ?? "",
    }),
    signal: createRequestTimeoutSignal(),
    redirect: "manual",
  });

  if (isSuccessfulGoogleFormResponse(response)) {
    return;
  }

  throw new Error(`Google Form submission failed (${response.status})`);
}

async function deliverViaFormSubmit(
  values: ContactFormValues,
  formSubmitId: string
): Promise<void> {
  const origin = siteConfig.url;
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(formSubmitId)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: origin,
        Referer: `${origin}/contact`,
      },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        message: values.message,
        social: values.social || "N/A",
        _subject: `Portfolio contact from ${values.name}`,
        _template: "table",
        _captcha: "false",
      }),
      signal: createRequestTimeoutSignal(),
    }
  );

  const data = await readJsonObject(response);
  if (data && isTruthySuccess(data.success)) return;

  const message =
    typeof data?.message === "string"
      ? data.message
      : `HTTP ${response.status}`;
  throw new Error(`Email delivery failed: ${message}`);
}

export async function deliverContactMessage(
  values: ContactFormValues
): Promise<void> {
  const googleForm = getGoogleFormConfig();
  if (googleForm) {
    await deliverViaGoogleForm(values, googleForm);
    return;
  }

  const formSubmitId = getFormSubmitId();
  if (!formSubmitId) {
    throw new Error(
      "Contact delivery is not configured. Set FORMSUBMIT_ID or a complete Google Form config."
    );
  }

  await deliverViaFormSubmit(values, formSubmitId);
}
