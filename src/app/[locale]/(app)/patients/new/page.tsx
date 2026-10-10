import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function NewPatientPage() {
  const locale = await getLocale();
  redirect({ href: "/patients", locale });
}