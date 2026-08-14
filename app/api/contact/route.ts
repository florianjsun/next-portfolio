import { NextResponse } from "next/server";

import { contactSchema } from "@/lib/contact";
import { createRequestTimeoutSignal } from "@/lib/http";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
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

    const res = await fetch(`${formLink}/formResponse?${formResponseParams}`, {
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
