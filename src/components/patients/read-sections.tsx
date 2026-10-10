import type React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function fmt(d: Date | string | null, locale: string, withTime = false): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function TableSection({
  columns,
  empty,
  isEmpty,
  children,
}: {
  columns: { label: string | undefined; className?: string }[];
  empty: string | undefined;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={i} className={c.className}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export type DiagnosisRow = {
  id: string;
  name: string;
  code: string | null;
  isPrimary: boolean;
  date: Date;
};

export function DiagnosesSection({
  rows,
  locale,
  labels,
}: {
  rows: DiagnosisRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <TableSection
      columns={[
        { label: labels.date },
        { label: labels.diagnoses },
        { label: labels.code },
        { label: labels.primary },
      ]}
      empty={labels.empty}
      isEmpty={rows.length === 0}
    >
      {rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {fmt(r.date, locale)}
          </TableCell>
          <TableCell className="font-medium">{r.name}</TableCell>
          <TableCell className="text-muted-foreground">{r.code ?? "—"}</TableCell>
          <TableCell>
            {r.isPrimary ? <Badge>{labels.yes}</Badge> : <span className="text-muted-foreground">—</span>}
          </TableCell>
        </TableRow>
      ))}
    </TableSection>
  );
}

export type AppointmentRow = {
  id: string;
  startTime: Date;
  type: string;
  status: string;
  doctor: string | null;
  department: string | null;
};

export function AppointmentsTable({
  rows,
  locale,
  labels,
}: {
  rows: AppointmentRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <TableSection
      columns={[
        { label: labels.date },
        { label: labels.visitType },
        { label: labels.doctor },
        { label: labels.department },
        { label: labels.status },
      ]}
      empty={labels.empty}
      isEmpty={rows.length === 0}
    >
      {rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {fmt(r.startTime, locale, true)}
          </TableCell>
          <TableCell>{r.type}</TableCell>
          <TableCell>{r.doctor ?? "—"}</TableCell>
          <TableCell>{r.department ?? "—"}</TableCell>
          <TableCell>
            <Badge variant="secondary">{r.status}</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableSection>
  );
}

export type LabRow = {
  id: string;
  testName: string;
  resultValue: string | null;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean | null;
  status: string;
  date: Date;
};

export function LaboratorySection({
  rows,
  locale,
  labels,
}: {
  rows: LabRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <TableSection
      columns={[
        { label: labels.date },
        { label: labels.result },
        { label: labels.unit },
        { label: labels.referenceRange },
        { label: labels.status },
      ]}
      empty={labels.empty}
      isEmpty={rows.length === 0}
    >
      {rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {fmt(r.date, locale)}
          </TableCell>
          <TableCell className="font-medium">
            {r.testName}
            {r.resultValue && (
              <span className={r.isAbnormal ? "ms-2 text-destructive" : "ms-2"}>
                {r.resultValue}
              </span>
            )}
          </TableCell>
          <TableCell>{r.unit ?? "—"}</TableCell>
          <TableCell className="text-muted-foreground">
            {r.referenceRange ?? "—"}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{r.status}</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableSection>
  );
}

export type ImagingRow = {
  id: string;
  modality: string | null;
  status: string;
  findings: string | null;
  date: Date;
};

export function ImagingSection({
  rows,
  locale,
  labels,
}: {
  rows: ImagingRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <TableSection
      columns={[
        { label: labels.date },
        { label: labels.modality },
        { label: labels.findings },
        { label: labels.status },
      ]}
      empty={labels.empty}
      isEmpty={rows.length === 0}
    >
      {rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {fmt(r.date, locale)}
          </TableCell>
          <TableCell className="font-medium">{r.modality ?? "—"}</TableCell>
          <TableCell className="max-w-md whitespace-pre-wrap text-muted-foreground">
            {r.findings ?? "—"}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{r.status}</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableSection>
  );
}

export type OrderRow = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  durationDays: number | null;
  quantity: string | null;
  unit: string | null;
  status: string;
  date: Date;
};

export function OrdersSection({
  rows,
  locale,
  labels,
}: {
  rows: OrderRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <TableSection
      columns={[
        { label: labels.date },
        { label: labels.name },
        { label: labels.dosage },
        { label: labels.frequency },
        { label: labels.quantity },
        { label: labels.status },
      ]}
      empty={labels.empty}
      isEmpty={rows.length === 0}
    >
      {rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {fmt(r.date, locale)}
          </TableCell>
          <TableCell className="font-medium">{r.name}</TableCell>
          <TableCell>{r.dosage ?? "—"}</TableCell>
          <TableCell>{r.frequency ?? "—"}</TableCell>
          <TableCell>
            {r.quantity ? `${r.quantity}${r.unit ? ` ${r.unit}` : ""}` : "—"}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{r.status}</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableSection>
  );
}

export type ClinicalNoteRow = {
  id: string;
  date: Date;
  doctor: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
};

export function ClinicalNotesSection({
  rows,
  locale,
  labels,
}: {
  rows: ClinicalNoteRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {labels.empty}
        </p>
      )}
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">{fmt(r.date, locale, true)}</span>
            <span className="text-muted-foreground">{r.doctor ?? "—"}</span>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [labels.subjective, r.subjective],
                [labels.objective, r.objective],
                [labels.assessment, r.assessment],
                [labels.plan, r.plan],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="whitespace-pre-wrap text-sm">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export type InvoiceRow = {
  id: string;
  invoiceNo: string;
  status: string;
  total: string;
  paid: string;
  balance: string;
  date: Date;
};

export function InvoicesSection({
  rows,
  locale,
  labels,
}: {
  rows: InvoiceRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <TableSection
      columns={[
        { label: labels.invoiceNo },
        { label: labels.date },
        { label: labels.total },
        { label: labels.paid },
        { label: labels.balance },
        { label: labels.status },
      ]}
      empty={labels.empty}
      isEmpty={rows.length === 0}
    >
      {rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="font-mono text-xs">{r.invoiceNo}</TableCell>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {fmt(r.date, locale)}
          </TableCell>
          <TableCell dir="ltr">{r.total}</TableCell>
          <TableCell dir="ltr">{r.paid}</TableCell>
          <TableCell dir="ltr">{r.balance}</TableCell>
          <TableCell>
            <Badge variant="secondary">{r.status}</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableSection>
  );
}

export type AuditRow = {
  id: string;
  action: string;
  entity: string;
  actor: string | null;
  date: Date;
};

export function AuditSection({
  rows,
  locale,
  labels,
}: {
  rows: AuditRow[];
  locale: string;
  labels: Record<string, string>;
}) {
  return (
    <TableSection
      columns={[
        { label: labels.date },
        { label: labels.action },
        { label: labels.actor },
      ]}
      empty={labels.empty}
      isEmpty={rows.length === 0}
    >
      {rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {fmt(r.date, locale, true)}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{r.action}</Badge>
          </TableCell>
          <TableCell>{r.actor ?? "—"}</TableCell>
        </TableRow>
      ))}
    </TableSection>
  );
}
