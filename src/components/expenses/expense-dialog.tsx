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

type Labels = {
  add: string;
  description: string;
  amount: string;
  category: string;
  paidAt: string;
  notes: string;
  save: string;
  saving: string;
};

export function ExpenseDialog({
  labels,
  action,
}: {
  labels: Labels;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      await action(formData);
      setOpen(false);
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
            <Label>{labels.description}</Label>
            <Input name="description" required />
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.amount}</Label>
            <Input name="amount" type="number" step="0.01" required />
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.category}</Label>
            <Input name="category" />
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.paidAt}</Label>
            <Input
              name="paidAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>{labels.notes}</Label>
            <Textarea name="notes" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? labels.saving : labels.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
