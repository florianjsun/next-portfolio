import { redirect } from "next/navigation";

export default function ResumePage() {
  redirect(process.env.NEXT_PUBLIC_RESUME_LINK || "/");
}
