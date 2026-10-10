"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { removeInvoiceItem } from "@/app/[locale]/(app)/billing/actions";
import { useRouter } from "@/i18n/navigation";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <button
      className="justify-self-end text-muted-foreground hover:text-destructive disabled:opacity-50"
      disabled={busy}
      aria-label="remove"
      onClick={async () => {
        setBusy(true);
        const res = await removeInvoiceItem(itemId);
        if (res.ok) router.refresh();
        setBusy(false);
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}