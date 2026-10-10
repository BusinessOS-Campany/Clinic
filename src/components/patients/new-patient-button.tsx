"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";

export function NewPatientButton() {
  const t = useTranslations("patients");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        {t("newPatient")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("newPatient")}</DialogTitle>
          </DialogHeader>
          <PatientForm onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}