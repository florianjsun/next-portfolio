import { verifyWebhookSignature } from "@notionhq/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { BLOG_CACHE_TAG } from "@/lib/blogs";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const rawBody = await request.text();

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

    console.info(
      "Notion webhook verification token received. Store it as " +
        `NOTION_WEBHOOK_VERIFICATION_TOKEN: ${verificationToken}`
    );

    return NextResponse.json({ ok: true });
  }

  if (!configuredVerificationToken) {
    return NextResponse.json(
      { error: "Webhook verification is not configured" },
      { status: 503 }
    );
  }

  const signatureIsValid = await verifyWebhookSignature({
    body: rawBody,
    signature: request.headers.get("x-notion-signature"),
    verificationToken: configuredVerificationToken,
  });

  if (!signatureIsValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  revalidateTag(BLOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/blogs");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
