"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deletePatient } from "@/app/[locale]/(app)/patients/actions";
import { Button } from "@/components/ui/button";

export function DeletePatientButton({ patientId }: { patientId: string }) {
  const t = useTranslations("patients");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove(force: boolean) {
    setBusy(true);
    const res = await deletePatient(patientId, force ? { force: true } : undefined);
    setBusy(false);
    if (res.ok) {
      toast.success(t("patientDeleted"));
      router.push("/patients");
      router.refresh();
      return;
    }
    if (res.error === "has-history" && res.counts) {
      const { encounters, visits, invoices } = res.counts;
      if (
        window.confirm(
          t("deleteHistoryWarning", { name: "", encounters, visits, invoices }),
        )
      ) {
        await remove(true);
      }
      return;
    }
    toast.error(t("actionFailed"));
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => {
        if (window.confirm(t("deleteConfirm"))) remove(false);
      }}
    >
      <Trash2 />
      {t("delete")}
    </Button>
  );
}
