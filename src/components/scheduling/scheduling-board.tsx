"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarDays, Clock, Plus, Save, Trash2 } from "lucide-react";
import {
  addScheduleException,
  deleteScheduleException,
  getAvailableSlots,
  getDoctorSchedules,
  listScheduleExceptions,
  saveDoctorSchedule,
  type ScheduleExceptionRow,
  type ScheduleRow,
} from "@/app/[locale]/(app)/scheduling/actions";
import type { AvailabilitySlot } from "@/app/[locale]/(app)/scheduling/availability";
import { SLOT_OPTIONS } from "@/app/[locale]/(app)/scheduling/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const minutesToClock = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const clockToMinutes = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

export function SchedulingBoard({
  doctors,
  canWrite,
}: {
  doctors: { id: string; label: string }[];
  canWrite: boolean;
}) {
  const t = useTranslations("scheduling");
  const tc = useTranslations("common");

  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleExceptionRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [availDate, setAvailDate] = useState(todayIso());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    let active = true;
    void Promise.all([
      getDoctorSchedules(doctorId),
      listScheduleExceptions(doctorId),
    ]).then(([r, e]) => {
      if (!active) return;
      setRows(r);
      setExceptions(e);
    });
    return () => {
      active = false;
    };
  }, [doctorId]);

  const loadSlots = useCallback(async () => {
    if (!doctorId || !availDate) return;
    setLoadingSlots(true);
    const res = await getAvailableSlots({ doctorId, date: availDate });
    setSlots(res);
    setLoadingSlots(false);
  }, [doctorId, availDate]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  function setRow(weekday: number, patch: Partial<ScheduleRow>) {
    setRows((rs) =>
      rs.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)),
    );
  }

  async function refreshExceptions() {
    setExceptions(await listScheduleExceptions(doctorId));
    void loadSlots();
  }

  async function submitSchedule() {
    if (!doctorId) return;
    setSaving(true);
    const res = await saveDoctorSchedule({ doctorId, rows });
    setSaving(false);
    if (res.ok) {
      toast.success(t("scheduleSaved"));
      void loadSlots();
    } else {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex w-full max-w-sm flex-col gap-2">
            <Label>{t("doctor")}</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canWrite && (
            <Button onClick={submitSchedule} disabled={saving || !doctorId}>
              <Save />
              {t("saveSchedule")}
            </Button>
          )}
        </CardContent>
      </Card>

      {doctors.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("noDoctors")}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-0 p-0">
              <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
                <CalendarDays className="size-4 text-primary" />
                {t("weeklySchedule")}
              </div>
              <ul className="flex flex-col divide-y">
                {rows.map((row) => (
                  <WeekdayRow
                    key={row.weekday}
                    row={row}
                    disabled={!canWrite}
                    weekdayLabel={t(`weekday_${row.weekday}`)}
                    onPatch={(patch) => setRow(row.weekday, patch)}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-3 p-0">
                <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
                  <Clock className="size-4 text-primary" />
                  {t("availability")}
                </div>
                <div className="flex flex-col gap-3 px-4 py-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>{t("date")}</Label>
                      <Input
                        type="date"
                        value={availDate}
                        onChange={(e) => setAvailDate(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={loadSlots}
                      disabled={loadingSlots}
                    >
                      <Clock />
                      {t("checkAvailability")}
                    </Button>
                  </div>
                  {loadingSlots ? (
                    <p className="text-sm text-muted-foreground">
                      {tc("loading")}
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("noSlots")}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map((s) => (
                        <span
                          key={s.startMinute}
                          className={
                            s.available
                              ? "rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                              : "rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground line-through"
                          }
                        >
                          {s.time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-0 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="size-4 text-primary" />
                    {t("exceptions")}
                  </span>
                  {canWrite && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Plus />
                      {t("addException")}
                    </Button>
                  )}
                </div>
                {exceptions.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {t("noExceptions")}
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y">
                    {exceptions.map((ex) => (
                      <li
                        key={ex.id}
                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <span className="font-mono">{ex.date}</span>
                            <Badge
                              variant={
                                ex.type === "TIME_OFF" ? "warning" : "info"
                              }
                            >
                              {t(`type_${ex.type}`)}
                            </Badge>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ex.startMinute != null && ex.endMinute != null
                              ? `${minutesToClock(ex.startMinute)} – ${minutesToClock(ex.endMinute)}`
                              : t("fullDay")}
                            {ex.reason ? ` · ${ex.reason}` : ""}
                          </span>
                        </div>
                        {canWrite && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={tc("delete")}
                            onClick={async () => {
                              const res = await deleteScheduleException(ex.id);
                              if (res.ok) {
                                toast.success(t("exceptionDeleted"));
                                void refreshExceptions();
                              } else {
                                toast.error(t("saveFailed"));
                              }
                            }}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <ExceptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        doctorId={doctorId}
        onAdded={refreshExceptions}
      />
    </div>
  );
}

function WeekdayRow({
  row,
  disabled,
  weekdayLabel,
  onPatch,
}: {
  row: ScheduleRow;
  disabled: boolean;
  weekdayLabel: string;
  onPatch: (patch: Partial<ScheduleRow>) => void;
}) {
  const t = useTranslations("scheduling");
  const breakOn = row.breakStartMinute != null && row.breakEndMinute != null;
  const controlDisabled = disabled || !row.isActive;

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-[var(--primary)]"
            checked={row.isActive}
            disabled={disabled}
            onChange={(e) => onPatch({ isActive: e.target.checked })}
          />
          {weekdayLabel}
        </label>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <input
            type="time"
            className="rounded-md border bg-background px-1.5 py-0.5 disabled:opacity-50"
            value={minutesToClock(row.startMinute)}
            disabled={controlDisabled}
            onChange={(e) =>
              onPatch({ startMinute: clockToMinutes(e.target.value) })
            }
          />
          <span>–</span>
          <input
            type="time"
            className="rounded-md border bg-background px-1.5 py-0.5 disabled:opacity-50"
            value={minutesToClock(row.endMinute)}
            disabled={controlDisabled}
            onChange={(e) =>
              onPatch({ endMinute: clockToMinutes(e.target.value) })
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 ps-6 text-xs text-muted-foreground">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            className="size-3.5 accent-[var(--primary)]"
            checked={breakOn}
            disabled={controlDisabled}
            onChange={(e) =>
              onPatch(
                e.target.checked
                  ? { breakStartMinute: 720, breakEndMinute: 780 }
                  : { breakStartMinute: null, breakEndMinute: null },
              )
            }
          />
          {t("break")}
        </label>
        {breakOn && (
          <span className="flex items-center gap-1">
            <input
              type="time"
              className="rounded-md border bg-background px-1.5 py-0.5 disabled:opacity-50"
              value={minutesToClock(row.breakStartMinute ?? 720)}
              disabled={controlDisabled}
              onChange={(e) =>
                onPatch({ breakStartMinute: clockToMinutes(e.target.value) })
              }
            />
            <span>–</span>
            <input
              type="time"
              className="rounded-md border bg-background px-1.5 py-0.5 disabled:opacity-50"
              value={minutesToClock(row.breakEndMinute ?? 780)}
              disabled={controlDisabled}
              onChange={(e) =>
                onPatch({ breakEndMinute: clockToMinutes(e.target.value) })
              }
            />
          </span>
        )}
        <label className="flex items-center gap-1.5">
          {t("slot")}
          <select
            className="rounded-md border bg-background px-1.5 py-0.5 disabled:opacity-50"
            value={row.slotMinutes}
            disabled={controlDisabled}
            onChange={(e) => onPatch({ slotMinutes: Number(e.target.value) })}
          >
            {SLOT_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} {t("minShort")}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}

function ExceptionDialog({
  open,
  onOpenChange,
  doctorId,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doctorId: string;
  onAdded: () => void | Promise<void>;
}) {
  const t = useTranslations("scheduling");
  const tc = useTranslations("common");
  const [type, setType] = useState<"TIME_OFF" | "EXTRA_HOURS">("TIME_OFF");
  const [date, setDate] = useState(todayIso());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (type === "EXTRA_HOURS" && (!start || !end)) {
      toast.error(t("rangeRequired"));
      return;
    }
    setSaving(true);
    const res = await addScheduleException({
      doctorId,
      date,
      type,
      startMinute: start ? clockToMinutes(start) : null,
      endMinute: end ? clockToMinutes(end) : null,
      reason: reason || undefined,
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t("exceptionAdded"));
      setStart("");
      setEnd("");
      setReason("");
      onOpenChange(false);
      await onAdded();
    } else {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addException")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("exceptionType")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIME_OFF">{t("type_TIME_OFF")}</SelectItem>
                  <SelectItem value="EXTRA_HOURS">
                    {t("type_EXTRA_HOURS")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("date")}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("startTime")}</Label>
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("endTime")}</Label>
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          {type === "TIME_OFF" && (
            <p className="text-xs text-muted-foreground">
              {t("fullDayHint")}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label>{t("reason")}</Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
