import { getTranslations } from "next-intl/server";
import { Activity, FlaskConical, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand";

const FEATURES = [
  { icon: Activity, title: "featureClinicalTitle", desc: "featureClinicalDesc" },
  { icon: FlaskConical, title: "featureLabTitle", desc: "featureLabDesc" },
  { icon: ShieldCheck, title: "featureSecurityTitle", desc: "featureSecurityDesc" },
] as const;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");
  const ta = await getTranslations("auth");

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {/* Ambient aurora backdrop */}
      <div className="auth-aurora -z-10" aria-hidden>
        <div className="auth-grid-lines absolute inset-0" />
        <div className="auth-orb auth-orb-a -top-32 start-[-10%] size-[38rem] bg-primary/25" />
        <div className="auth-orb auth-orb-b top-1/4 end-[-14%] size-[34rem] bg-info/20" />
        <div className="auth-orb auth-orb-c bottom-[-18%] start-1/3 size-[30rem] bg-chart-4/15" />
      </div>

      <div className="mx-auto grid min-h-svh w-full max-w-[1600px] lg:grid-cols-2">
        {/* Showcase panel */}
        <aside className="relative hidden flex-col justify-center gap-10 p-12 lg:flex xl:p-16">
          <div className="auth-reveal flex items-center gap-3" style={{ animationDelay: "0ms" }}>
            <span className="auth-pulse-ring relative rounded-xl">
              <BrandMark className="size-11 rounded-xl" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight">{t("appName")}</span>
              <span className="text-xs text-muted-foreground">{ta("productLine")}</span>
            </div>
          </div>

          <div className="flex max-w-lg flex-col gap-5">
            <h1
              className="auth-reveal text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl"
              style={{ animationDelay: "90ms" }}
            >
              {ta("showcaseTitle")}
            </h1>
            <p
              className="auth-reveal text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "170ms" }}
            >
              {ta("showcaseSubtitle")}
            </p>
          </div>

          <ul className="flex max-w-lg flex-col gap-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <li
                  key={f.title}
                  className="auth-reveal flex items-start gap-4"
                  style={{ animationDelay: `${250 + i * 90}ms` }}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-colors duration-300 hover:bg-primary/15">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex flex-col gap-0.5 pt-0.5">
                    <span className="text-sm font-medium">{ta(f.title)}</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {ta(f.desc)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div
            className="auth-reveal flex items-center gap-2 text-xs text-muted-foreground"
            style={{ animationDelay: "560ms" }}
          >
            <LockKeyhole className="size-3.5" aria-hidden />
            {ta("securityNote")}
          </div>
        </aside>

        {/* Form panel */}
        <main className="relative flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-[26rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}