"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { navGroups, type NavItem } from "@/components/layout/nav";
import { saveUserPagePermissions } from "@/app/[locale]/(app)/users/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PageDef = {
  key: string;
  group: string;
  codes: string[];
};

function collectPages(): PageDef[] {
  const pages: PageDef[] = [];
  const visit = (item: NavItem, group: string) => {
    const codes = item.permissions ?? (item.permission ? [item.permission] : []);
    if (item.href && codes.length > 0) {
      pages.push({ key: item.key, group, codes });
    }
    item.children?.forEach((child) => visit(child, group));
  };
  for (const g of navGroups) {
    for (const item of g.items) visit(item, g.key);
  }
  return pages;
}

const PAGES = collectPages();
const GROUPS = ["main", "doctor", "clinical", "operations", "financial", "admin"];

export function UserPagesDialog({
  userId,
  userName,
  roleCodes,
  grantedCodes,
}: {
  userId: string;
  userName: string;
  roleCodes: string[];
  grantedCodes: string[];
}) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const inherited = useMemo(() => {
    const set = new Set(roleCodes);
    return (page: PageDef) => page.codes.some((c) => set.has(c));
  }, [roleCodes]);

  const initial = useMemo(() => {
    const set = new Set(grantedCodes);
    const state: Record<string, boolean> = {};
    for (const page of PAGES) {
      state[page.key] = inherited(page) || page.codes.some((c) => set.has(c));
    }
    return state;
  }, [grantedCodes, inherited]);

  const [checked, setChecked] = useState<Record<string, boolean>>(initial);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) setChecked(initial);
  }

  async function save() {
    const codes = PAGES.filter(
      (page) => checked[page.key] && !inherited(page),
    ).flatMap((page) => page.codes);
    setBusy(true);
    try {
      const res = await saveUserPagePermissions(userId, codes);
      if (res.ok) {
        toast.success(t("pagesSaved"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(t("pagesSaveFailed"));
      }
    } catch {
      toast.error(t("pagesSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="me-1.5 h-4 w-4" />
          {t("pagePermissions")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("pagePermissions")}</DialogTitle>
          <DialogDescription>
            {t("pagePermissionsFor", { name: userName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {GROUPS.map((group) => {
            const pages = PAGES.filter((p) => p.group === group);
            if (pages.length === 0) return null;
            return (
              <div key={group} className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tn(group)}
                </span>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {pages.map((page) => {
                    const locked = inherited(page);
                    return (
                      <label
                        key={page.key}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm"
                      >
                        <Checkbox
                          checked={checked[page.key] ?? false}
                          disabled={locked || busy}
                          onCheckedChange={(v) =>
                            setChecked((s) => ({ ...s, [page.key]: v === true }))
                          }
                        />
                        <span className="flex-1">{tn(page.key)}</span>
                        {locked && (
                          <span className="text-[10px] text-muted-foreground">
                            {t("fromRole")}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            {tc("cancel")}
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? tc("saving") : tc("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
