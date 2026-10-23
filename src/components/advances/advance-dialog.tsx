"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Labels = {
  add: string;
  employee: string;
  amount: string;
  reason: string;
  givenAt: string;
  notes: string;
  save: string;
  saving: string;
};

export function AdvanceDialog({
  employees,
  labels,
  action,
}: {
  employees: { id: string; name: string; nameAr: string | null }[];
  labels: Labels;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      formData.set("employeeId", employeeId);
      await action(formData);
      setOpen(false);
      setEmployeeId("");
    } catch {
      alert(labels.save);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          {labels.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.add}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label>{labels.employee}</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder={labels.employee} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nameAr ?? e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.amount}</Label>
            <Input name="amount" type="number" step="0.01" required />
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.reason}</Label>
            <Input name="reason" />
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.givenAt}</Label>
            <Input
              name="givenAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.notes}</Label>
            <Textarea name="notes" />
          </div>
          <Button type="submit" disabled={loading || !employeeId}>
            {loading ? labels.saving : labels.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
