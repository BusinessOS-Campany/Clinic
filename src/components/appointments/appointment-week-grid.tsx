"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_H = 44;
const HOUR_H = SLOT_H * 2;

export type GridAppointment = {
  id: string;
  start: string;
  end: string;
  patientName: string;
  doctorName: string | null;
  status: string;
};

export type GridDay = {
  iso: string;
  year: number;
  month: number;
  day: number;
  today: boolean;
};

const STATUS_CLASSES: Record<string, string> = {
  SCHEDULED: "border-secondary-foreground/20 bg-secondary/70 text-secondary-foreground",
  CONFIRMED: "border-info/40 bg-info/15 text-info",
  ARRIVED: "border-warning/40 bg-warning/15 text-warning",
  IN_SERVICE: "border-primary/40 bg-primary/15 text-primary",
  COMPLETED: "border-success/40 bg-success/15 text-success",
  CANCELLED: "border-border bg-muted text-muted-foreground line-through",
  NO_SHOW: "border-border bg-muted/60 text-muted-foreground",
};

const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function toTime(iso: string) {
  const d = new Date(iso);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function AppointmentWeekGrid({
  days,
  appointments,
}: {
  days: GridDay[];
  appointments: GridAppointment[];
}) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const bodyHeight = hours.length * HOUR_H;

  function greetLabel(iso: string) {
    const d = new Date(`${iso}T00:00:00Z`);
    const weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }).format(d);
    const month = new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: "UTC",
    }).format(d);
    return { weekday, month };
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="flex min-w-[820px]">
        <div
          className="relative w-14 shrink-0 border-e bg-muted/30"
          style={{ height: 64 + bodyHeight }}
        >
          <div
            className="relative"
            style={{ top: 64, height: bodyHeight }}
          >
            {hours.map((h, i) => (
              <span
                key={h}
                className="absolute start-0 -translate-y-1/2 px-2 text-[11px] font-medium text-muted-foreground"
                style={{ top: i * HOUR_H + 1 }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-7">
          {days.map((d) => {
            const { weekday, month } = greetLabel(d.iso);
            return (
              <div
                key={d.iso}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 border-e py-3 last:border-e-0",
                  d.today && "bg-primary/5",
                )}
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  {weekday}
                </span>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                    d.today
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {d.day}
                </span>
                <span className="text-[10px] text-muted-foreground">{month}</span>
              </div>
            );
          })}

          {days.map((d) => {
            const dayApps = appointments
              .filter((a) => a.start.startsWith(d.iso))
              .map((a) => {
                const startMin =
                  new Date(a.start).getUTCHours() * 60 +
                  new Date(a.start).getUTCMinutes();
                const endMin =
                  new Date(a.end).getUTCHours() * 60 +
                  new Date(a.end).getUTCMinutes();
                const top =
                  ((Math.max(startMin, START_HOUR * 60) - START_HOUR * 60) / 60) *
                  HOUR_H;
                const height =
                  ((Math.max(endMin - startMin, 30)) / 60) * HOUR_H;
                return { ...a, top, height };
              });
            return (
              <div
                key={d.iso}
                className="relative min-h-0 border-e bg-background last:border-e-0"
                style={{ height: bodyHeight }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const minutesSinceStart = Math.floor((y / HOUR_H) * 60);
                  const minutes =
                    START_HOUR * 60 + minutesSinceStart - (minutesSinceStart % 30);
                  if (minutes < START_HOUR * 60 || minutes >= END_HOUR * 60) return;
                  const h = Math.floor(minutes / 60);
                  const m = minutes % 60;
                  router.push(
                    `/appointments/new?date=${d.iso}&start=${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
                  );
                }}
              >
                {hours.map((h, i) => (
                  <span
                    key={h}
                    className="absolute inset-x-0 border-t border-border/60"
                    style={{ top: i * HOUR_H }}
                  />
                ))}
                {hours.slice(0, -1).map((h, i) => (
                  <span
                    key={`half-${h}`}
                    className="absolute inset-x-0 border-t border-dashed border-border/40"
                    style={{ top: i * HOUR_H + SLOT_H }}
                  />
                ))}
                {dayApps.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/appointments/${a.id}`);
                    }}
                    className={cn(
                      "absolute inset-x-1 z-10 flex cursor-pointer flex-col gap-0.5 overflow-hidden rounded-md border-s-2 px-1.5 py-1 text-start text-[11px] shadow-sm transition-transform hover:z-20 hover:-translate-y-px hover:scale-[1.01]",
                      STATUS_CLASSES[a.status] ??
                        "bg-secondary/70 text-secondary-foreground",
                    )}
                    style={{ top: a.top, height: a.height }}
                  >
                    <span className="truncate font-semibold">
                      {a.patientName}
                    </span>
                    <span className="font-mono opacity-80">
                      {toTime(a.start)}–{toTime(a.end)}
                    </span>
                    {a.doctorName && (
                      <span className="truncate opacity-70">{a.doctorName}</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}