"use client";

import { useState } from "react";
import { toast } from "sonner";
import { assignRole } from "@/app/[locale]/(app)/users/actions";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UserRoleSelect({
  id,
  currentRoleId,
  roles,
  labels,
}: {
  id: string;
  currentRoleId: string;
  roles: { id: string; label: string }[];
  labels: { role: string; roleChanged: string; failed: string };
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <Select
      value={currentRoleId}
      disabled={busy}
      onValueChange={async (roleId) => {
        if (roleId === currentRoleId) return;
        setBusy(true);
        const res = await assignRole(id, roleId);
        if (res.ok) {
          toast.success(labels.roleChanged);
          router.refresh();
        } else {
          toast.error(labels.failed);
        }
        setBusy(false);
      }}
    >
      <SelectTrigger className="w-44 text-xs">
        <SelectValue placeholder={labels.role} />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}