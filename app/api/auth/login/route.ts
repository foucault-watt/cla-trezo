import { redirect } from "next/navigation";
import { getClaLoginUrl } from "@/lib/auth/cla";

export async function GET() {
  redirect(getClaLoginUrl());
}
