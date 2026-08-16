import "server-only";

import { siteConfig } from "@/config/site";
import type { ContactFormValues } from "@/lib/contact";
import { createRequestTimeoutSignal } from "@/lib/http";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentSubmissions = new Map<string, number[]>();

// FormSubmit activation hash for portfolio.sunnao.wtf/contact.
// Hides the inbox address from the submission URL.
const DEFAULT_FORMSUBMIT_ID = "ea503ee8e4fc2b83da9810f70d0861a7";

type GoogleFormConfig = {
  formLink: string;
  fieldIdName: string;
  fieldIdEmail: string;
  fieldIdMessage: string;
  fieldIdSocial: string;
};

function getFormSubmitId(): string {
  return process.env.FORMSUBMIT_ID?.trim() || DEFAULT_FORMSUBMIT_ID;
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function isContactRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (recentSubmissions.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(ip, recent);
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

  // Google often answers 401 / 302 for a successful formResponse POST.
  if (response.ok || response.status === 401 || response.status === 302) {
    return;
  }

  throw new Error(`Google Form submission failed (${response.status})`);
}

async function deliverViaFormSubmit(values: ContactFormValues): Promise<void> {
  const origin = siteConfig.url;
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(getFormSubmitId())}`,
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

  await deliverViaFormSubmit(values);
}
