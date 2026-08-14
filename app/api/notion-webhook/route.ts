import { verifyWebhookSignature } from "@notionhq/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { BLOG_CACHE_TAG } from "@/lib/blog-cache";
import { readRequestBody } from "@/lib/http";

export const runtime = "nodejs";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 }
    );
  }

  const rawBody = await readRequestBody(request, MAX_WEBHOOK_BODY_BYTES);
  if (rawBody === null) {
    return NextResponse.json(
      { error: "Request body is too large" },
      { status: 413 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const configuredVerificationToken =
    process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN?.trim();

  if (
    !configuredVerificationToken &&
    isRecord(payload) &&
    typeof payload.verification_token === "string"
  ) {
    const verificationToken = payload.verification_token;

    if (
      verificationToken.length < 20 ||
      verificationToken.length > 256 ||
      !/^[A-Za-z0-9_-]+$/.test(verificationToken)
    ) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    if (process.env.NOTION_WEBHOOK_LOG_VERIFICATION_TOKEN === "true") {
      console.info(
        "Notion webhook verification token received. Store it as " +
          `NOTION_WEBHOOK_VERIFICATION_TOKEN: ${verificationToken}`
      );
    } else {
      console.info(
        "Notion webhook verification token received but not logged. " +
          "Temporarily enable NOTION_WEBHOOK_LOG_VERIFICATION_TOKEN " +
          "during the initial handshake if no protected request inspector " +
          "is available."
      );
    }

    return NextResponse.json({ ok: true });
  }

  if (!configuredVerificationToken) {
    return NextResponse.json(
      { error: "Webhook verification is not configured" },
      { status: 503 }
    );
  }

  let signatureIsValid = false;
  try {
    signatureIsValid = await verifyWebhookSignature({
      body: rawBody,
      signature: request.headers.get("x-notion-signature"),
      verificationToken: configuredVerificationToken,
    });
  } catch {
    signatureIsValid = false;
  }

  if (!signatureIsValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  revalidateTag(BLOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/blogs");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
