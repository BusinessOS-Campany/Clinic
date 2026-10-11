"use client";

import { useState } from "react";
import { toast } from "sonner";
import { toggleActive } from "@/app/[locale]/(app)/users/actions";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function ToggleUserButton({
  id,
  active,
  labels,
}: {
  id: string;
  active: boolean;
  labels: { active: string; inactive: string; failed: string };
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant={active ? "outline" : "default"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await toggleActive(id, !active);
        if (res.ok) router.refresh();
        else toast.error(labels.failed);
        setBusy(false);
      }}
    >
      {active ? labels.inactive : labels.active}
    </Button>
  );
}