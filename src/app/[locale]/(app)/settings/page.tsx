import { getTranslations } from "next-intl/server";
import { Settings2 } from "lucide-react";
import { requirePermission } from "@/core/auth/session";
import { getSettings } from "@/core/settings";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicSettingsForm } from "@/components/settings/clinic-settings-form";
import { PreferencesPanel } from "@/components/preferences/preferences-panel";

export default async function SettingsPage() {
  await requirePermission("settings:read");
  const t = await getTranslations("common");
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("settings")}
        icon={Settings2}
        description="Clinic configuration, locale and appearance"
      />
      <Tabs defaultValue="clinic">
        <TabsList>
          <TabsTrigger value="clinic">Clinic</TabsTrigger>
          <TabsTrigger value="appearance">{t("settings")}</TabsTrigger>
        </TabsList>
        <TabsContent value="clinic" className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Clinic settings</CardTitle>
              <CardDescription>
                Currency, time zone, default language and date format used across
                the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicSettingsForm
                initial={{
                  currency: settings.currency,
                  timezone: settings.timezone,
                  locale: settings.locale,
                  dateFormat: settings.dateFormat,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance" className="max-w-lg">
          <PreferencesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}