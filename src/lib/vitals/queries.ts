import { prisma } from "@/lib/db";

export function patientAgeMonths(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  const months =
    (now.getUTCFullYear() - birthDate.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birthDate.getUTCMonth());
  const total = now.getUTCDate() < birthDate.getUTCDate() ? months - 1 : months;
  return total >= 0 ? total : 0;
}

export type NursingRosterEntry = {
  patientId: string;
  visitId: string;
  encounterId: string | null;
  mrn: string;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  birthDate: Date | null;
  gender: string;
  priority: string;
  queueStatus: string;
  position: number;
  arrivedAt: Date;
  lastRecordedAt: Date | null;
  openAlertCount: number;
  criticalAlertCount: number;
};

const ACTIVE_ENTRY = ["WAITING", "CALLED", "IN_PROGRESS"] as const;

export async function loadNursingQueue(
  clinicId: string,
): Promise<NursingRosterEntry[]> {
  const queue = await prisma.queue.findFirst({
    where: { clinicId, kind: "TRIAGE" },
    select: { id: true },
  });
  if (!queue) return [];

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: queue.id, status: { in: [...ACTIVE_ENTRY] } },
    orderBy: [{ priority: "desc" }, { visit: { arrivedAt: "asc" } }, { position: "asc" }],
    select: {
      status: true,
      position: true,
      visit: {
        select: {
          id: true,
          mrn: true,
          encounterId: true,
          priority: true,
          arrivedAt: true,
          patient: {
            select: {
              id: true,
              firstNameAr: true,
              lastNameAr: true,
              firstNameEn: true,
              lastNameEn: true,
              birthDate: true,
              gender: true,
            },
          },
        },
      },
    },
  });

  const patientIds = entries.map((e) => e.visit.patient.id);
  if (patientIds.length === 0) return [];

  const [recentVitals, openAlerts] = await Promise.all([
    prisma.vitalSign.findMany({
      where: { clinicId, patientId: { in: patientIds } },
      orderBy: { recordedAt: "desc" },
      select: { patientId: true, recordedAt: true },
    }),
    prisma.vitalAlert.findMany({
      where: {
        clinicId,
        patientId: { in: patientIds },
        acknowledged: false,
      },
      select: { patientId: true, severity: true },
    }),
  ]);

  const lastByPatient = new Map<string, Date>();
  for (const v of recentVitals) {
    if (!lastByPatient.has(v.patientId)) lastByPatient.set(v.patientId, v.recordedAt);
  }
  const alertStats = new Map<string, { open: number; critical: number }>();
  for (const a of openAlerts) {
    const cur = alertStats.get(a.patientId) ?? { open: 0, critical: 0 };
    cur.open += 1;
    if (a.severity === "CRITICAL") cur.critical += 1;
    alertStats.set(a.patientId, cur);
  }

  return entries.map((e) => {
    const p = e.visit.patient;
    const stats = alertStats.get(p.id) ?? { open: 0, critical: 0 };
    return {
      patientId: p.id,
      visitId: e.visit.id,
      encounterId: e.visit.encounterId,
      mrn: e.visit.mrn,
      firstNameAr: p.firstNameAr,
      lastNameAr: p.lastNameAr,
      firstNameEn: p.firstNameEn,
      lastNameEn: p.lastNameEn,
      birthDate: p.birthDate,
      gender: p.gender,
      priority: e.visit.priority,
      queueStatus: e.status,
      position: e.position,
      arrivedAt: e.visit.arrivedAt,
      lastRecordedAt: lastByPatient.get(p.id) ?? null,
      openAlertCount: stats.open,
      criticalAlertCount: stats.critical,
    };
  });
}

export async function loadVitalsForPatient(
  clinicId: string,
  patientId: string,
  limit = 20,
) {
  return prisma.vitalSign.findMany({
    where: { clinicId, patientId },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
}

export async function loadOpenVitalAlerts(clinicId: string, patientId: string) {
  return prisma.vitalAlert.findMany({
    where: { clinicId, patientId, acknowledged: false },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
  });
}

export async function loadRosterAlerts(
  clinicId: string,
  patientIds: string[],
) {
  if (patientIds.length === 0) return [];
  return prisma.vitalAlert.findMany({
    where: {
      clinicId,
      patientId: { in: patientIds },
      acknowledged: false,
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      patientId: true,
      vitalType: true,
      severity: true,
      message: true,
      value: true,
      createdAt: true,
    },
  });
}

export async function loadAlertRules(clinicId: string) {
  return prisma.vitalAlertRule.findMany({
    where: { clinicId, isActive: true },
    select: {
      id: true,
      vitalType: true,
      ageMin: true,
      ageMax: true,
      sex: true,
      conditionCode: true,
      minValue: true,
      maxValue: true,
      severity: true,
      message: true,
    },
  });
}
