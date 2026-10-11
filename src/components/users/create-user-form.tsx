"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createUser } from "@/app/[locale]/(app)/users/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateUserForm({
  roles,
  clinics,
  labels,
}: {
  roles: { id: string; label: string }[];
  clinics: { id: string; label: string }[];
  labels: {
    name: string;
    nameAr: string;
    username: string;
    email: string;
    password: string;
    role: string;
    clinic: string;
    create: string;
    success: string;
    failed: string;
  };
}) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", nameAr: "", username: "", email: "", password: "", roleId: "", clinicId: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || !f.username || !f.email || !f.password || !f.roleId) return;
    setBusy(true);
    try {
      const res = await createUser(f);
      if (res.ok) {
        toast.success(labels.success);
        setF({ name: "", nameAr: "", username: "", email: "", password: "", roleId: "", clinicId: "" });
        router.refresh();
      } else {
        toast.error(labels.failed);
      }
    } catch {
      toast.error(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{labels.create}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input placeholder={labels.name} value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
          <Input placeholder={labels.nameAr} value={f.nameAr} onChange={(e) => setF((s) => ({ ...s, nameAr: e.target.value }))} />
          <Input dir="ltr" placeholder={labels.username} value={f.username} onChange={(e) => setF((s) => ({ ...s, username: e.target.value }))} />
          <Input type="email" placeholder={labels.email} value={f.email} onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))} />
          <Input type="password" placeholder={labels.password} value={f.password} onChange={(e) => setF((s) => ({ ...s, password: e.target.value }))} />
          <Select value={f.roleId} onValueChange={(v) => setF((s) => ({ ...s, roleId: v }))}>
            <SelectTrigger><SelectValue placeholder={labels.role} /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select value={f.clinicId} onValueChange={(v) => setF((s) => ({ ...s, clinicId: v }))}>
              <SelectTrigger><SelectValue placeholder={labels.clinic} /></SelectTrigger>
              <SelectContent>
                {clinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={busy}>
              <Plus />
              {labels.create}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}