import { NextResponse } from "next/server";

import { contactSchema } from "@/lib/contact";
import {
  deliverContactMessage,
  getClientIp,
  isContactRateLimited,
  readHoneypot,
  stripHoneypot,
} from "@/lib/contact-delivery";
import { readRequestBody } from "@/lib/http";

const MAX_CONTACT_BODY_BYTES = 16 * 1024;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return new NextResponse("Content-Type must be application/json", {
      status: 415,
    });
  }

  if (isContactRateLimited(getClientIp(req))) {
    return new NextResponse("Too many submissions. Please try again later.", {
      status: 429,
    });
  }

  const rawBody = await readRequestBody(req, MAX_CONTACT_BODY_BYTES);
  if (rawBody === null) {
    return new NextResponse("Request body is too large", { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (readHoneypot(payload).trim()) {
    return NextResponse.json("Success!");
  }

  const parsed = contactSchema.safeParse(stripHoneypot(payload));
  if (!parsed.success) {
    return new NextResponse("Invalid form data", { status: 400 });
  }

  try {
    await deliverContactMessage(parsed.data);
    return NextResponse.json("Success!");
  } catch (error) {
    console.error("[contact] Failed to submit contact form", error);
    return new NextResponse("Failed to submit the form", { status: 502 });
  }
}
