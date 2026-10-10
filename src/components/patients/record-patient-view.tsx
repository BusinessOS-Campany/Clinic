"use client";

import { useEffect } from "react";
import { recordPatientView } from "@/app/[locale]/(app)/patients/actions";

export function RecordPatientView({ patientId }: { patientId: string }) {
  useEffect(() => {
    void recordPatientView(patientId).catch(() => {});
  }, [patientId]);

  return null;
}
