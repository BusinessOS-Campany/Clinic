import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function AccessDeniedPage() {
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" aria-hidden />
      </div>
      <div>
        <h1 className="text-xl font-semibold">403</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("error")} — you do not have permission to view this page.
        </p>
      </div>
      <Button asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </div>
  );
}