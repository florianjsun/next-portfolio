import { NextResponse } from "next/server";

import { contactSchema } from "@/lib/contact";
import { createRequestTimeoutSignal, readRequestBody } from "@/lib/http";

const MAX_CONTACT_BODY_BYTES = 16 * 1024;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return new NextResponse("Content-Type must be application/json", {
      status: 415,
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

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return new NextResponse("Invalid form data", { status: 400 });
  }

  const formLink = process.env.GOOGLE_FORM_LINK;

  // configure these according to your google form
  const fieldIdName = process.env.GOOGLE_FORM_FIELD_ID_NAME;
  const fieldIdEmail = process.env.GOOGLE_FORM_FIELD_ID_EMAIL;
  const fieldIdMessage = process.env.GOOGLE_FORM_FIELD_ID_MESSAGE;
  const fieldIdSocial = process.env.GOOGLE_FORM_FIELD_ID_SOCIAL;

  if (
    !formLink ||
    !fieldIdName ||
    !fieldIdEmail ||
    !fieldIdMessage ||
    !fieldIdSocial
  ) {
    return new NextResponse("Please configure the env variables", {
      status: 500,
    });
  }

  try {
    const { name, email, message, social } = parsed.data;
    const formResponseParams = new URLSearchParams({
      [fieldIdName]: name,
      [fieldIdEmail]: email,
      [fieldIdMessage]: message,
      [fieldIdSocial]: social ?? "",
    });

    const res = await fetch(`${formLink}/formResponse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formResponseParams,
      signal: createRequestTimeoutSignal(),
    });
    if (!res.ok) {
      return new NextResponse("Failed to submit the form", { status: 502 });
    }

    return NextResponse.json("Success!");
  } catch (error) {
    console.error("[contact] Failed to submit contact form", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
