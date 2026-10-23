"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { signIn } from "@/core/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  username: z.string().trim().min(1, "required"),
  password: z.string().min(1, "required"),
});

type FormValues = z.infer<typeof schema>;

const EASE = [0.16, 1, 0.3, 1] as const;

export function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const reduce = useReducedMotion();

  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shake, setShake] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const usernameField = register("username");
  const passwordField = register("password");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await signIn.username({ username: values.username, password: values.password });
      if (res.error) {
        setShake((n) => n + 1);
        setError("password", { message: "invalid" });
        setError("root", { message: "invalid" });
        return;
      }
      toast.success(tc("success"));
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const fadeUp = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16, filter: "blur(8px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  const fieldMessage = (code: string | undefined) => {
    if (!code) return undefined;
    if (code === "invalid") return t("invalidCredentials");
    return tc("required");
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="relative"
    >
      {/* Rotating conic glow */}
      <div className="auth-ring" aria-hidden />

      <div className="auth-glass relative overflow-hidden rounded-2xl border p-7 shadow-2xl shadow-primary/10 sm:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,var(--primary)/0.16,transparent)]"
          aria-hidden
        />

        <motion.div
          key={shake}
          animate={reduce || shake === 0 ? undefined : { x: [0, -9, 8, -5, 3, 0] }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative flex flex-col gap-7"
        >
          <motion.header {...fadeUp(0.12)} className="flex flex-col gap-3 text-center">
            <motion.div
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
              className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            >
              <LogIn className="size-6" aria-hidden />
            </motion.div>

            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{t("signInTitle")}</h1>
              <p className="text-sm text-muted-foreground">{t("signInSubtitle")}</p>
            </div>
          </motion.header>

          <motion.form
            onSubmit={handleSubmit(onSubmit, () => setShake((n) => n + 1))}
            {...fadeUp(0.22)}
            className="flex flex-col gap-4"
            noValidate
          >
            {/* Username */}
            <motion.div {...fadeUp(0.3)} className="group relative flex flex-col gap-2">
              <Label
                htmlFor="username"
                className="text-xs font-medium tracking-wide text-muted-foreground transition-colors duration-200 group-focus-within:text-primary"
              >
                {t("username")}
              </Label>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-primary"
                  aria-hidden
                />
                <Input
                  id="username"
                  autoComplete="username"
                  dir="ltr"
                  className="h-11 ps-10 transition-all duration-300 focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
                  aria-invalid={Boolean(errors.username)}
                  {...usernameField}
                  onChange={(e) => {
                    clearErrors();
                    usernameField.onChange(e);
                  }}
                />
              </div>
              <FieldMessage message={fieldMessage(errors.username?.message)} />
            </motion.div>

            {/* Password */}
            <motion.div {...fadeUp(0.38)} className="group relative flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium tracking-wide text-muted-foreground transition-colors duration-200 group-focus-within:text-primary"
              >
                {t("password")}
              </Label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-primary"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={revealed ? "text" : "password"}
                  autoComplete="current-password"
                  dir="ltr"
                  className="h-11 ps-10 pe-11 transition-all duration-300 focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
                  aria-invalid={Boolean(errors.password)}
                  {...passwordField}
                  onChange={(e) => {
                    clearErrors();
                    passwordField.onChange(e);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  aria-label={revealed ? t("hidePassword") : t("showPassword")}
                  title={revealed ? t("hidePassword") : t("showPassword")}
                  className="absolute inset-y-0 end-1.5 my-auto flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={revealed ? "hide" : "show"}
                      initial={reduce ? false : { opacity: 0, scale: 0.6, rotate: -35 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={reduce ? undefined : { opacity: 0, scale: 0.6, rotate: 35 }}
                      transition={{ duration: 0.18 }}
                      className="flex"
                    >
                      {revealed ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
              <FieldMessage message={fieldMessage(errors.password?.message)} />
            </motion.div>

            <AnimatePresence>
              {errors.root && (
                <motion.p
                  initial={reduce ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {t("invalidCredentials")}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div {...fadeUp(0.46)}>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className={cn(
                  "auth-sheen group relative h-11 w-full overflow-hidden rounded-xl text-base font-semibold",
                  "shadow-lg shadow-primary/25 transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30",
                  "active:translate-y-0 active:scale-[0.985]",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {submitting ? (
                    <motion.span
                      key="loading"
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      {tc("saving")}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2"
                    >
                      {t("signIn")}
                      <ArrowRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                        aria-hidden
                      />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.form>

          <motion.div {...fadeUp(0.54)} className="flex items-center justify-center gap-2">
            <CheckCircle2 className="size-3.5 text-primary/70" aria-hidden />
            <p className="text-xs text-muted-foreground">{t("demoCredentials")}</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FieldMessage({ message }: { message?: string }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-medium text-destructive"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}