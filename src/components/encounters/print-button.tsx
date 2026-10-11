"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PrintButton({
  ns = "encounters",
  labelKey = "printReport",
}: {
  ns?: string;
  labelKey?: string;
}) {
  const t = useTranslations(ns);
  return (
    <Button variant="outline" className="print:hidden" onClick={() => window.print()} type="button">
      <Printer />
      {t(labelKey)}
    </Button>
  );
}