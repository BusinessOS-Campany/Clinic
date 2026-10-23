import "dotenv/config";
import { prisma } from "../src/lib/db";
import { auth } from "../src/core/auth/server";

const SLOTS: {
  mrn: string;
  day: number;
  hh: string;
  mm: string;
  duration: number;
  type: "INITIAL" | "FOLLOW_UP" | "CONSULTATION" | "VACCINATION" | "PROCEDURE" | "RE_EVALUATION";
  reason: string;
}[] = [
  { mrn: "P00001", day: 0, hh: "09", mm: "00", duration: 30, type: "CONSULTATION", reason: "آلام أسفل الظهر" },
  { mrn: "P00002", day: 1, hh: "10", mm: "30", duration: 45, type: "FOLLOW_UP", reason: "متابعة نتائج المختبر" },
  { mrn: "P00003", day: 2, hh: "09", mm: "30", duration: 30, type: "INITIAL", reason: "فحص ضغط الدم الأول" },
  { mrn: "P00004", day: 2, hh: "11", mm: "00", duration: 30, type: "VACCINATION", reason: "تطعيم الإنفلونزا" },
  { mrn: "P00005", day: 3, hh: "10", mm: "00", duration: 60, type: "RE_EVALUATION", reason: "إعادة تقييم السكري" },
  { mrn: "P00006", day: 5, hh: "12", mm: "15", duration: 15, type: "PROCEDURE", reason: "إزالة خياطة جراحية" },
  { mrn: "P00007", day: 6, hh: "09", mm: "15", duration: 30, type: "CONSULTATION", reason: "حمى وسعال" },
];

function startOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function statusFor(dayIndex: number, todayIndex: number) {
  if (dayIndex < todayIndex) return "COMPLETED";
  if (dayIndex === todayIndex) return "ARRIVED";
  return "CONFIRMED";
}

async function demoAppointments() {
  const clinic = await prisma.clinic.findFirst({ where: { code: "MAIN" } });
  if (!clinic) throw new Error("MAIN clinic missing — run db:seed first");

  if ((await prisma.appointment.count({ where: { clinicId: clinic.id } })) > 0) {
    console.log("Skipping: appointments already exist");
    return;
  }

  const patients = await prisma.patient.findMany({
    where: { clinicId: clinic.id, mrn: { startsWith: "P" } },
    select: { id: true, mrn: true },
  });
  const patientById = new Map(patients.map((p) => [p.mrn, p.id]));
  if (patients.length === 0) {
    console.log("Skipping: no demo patients — run db:demo-patients first");
    return;
  }

  let doctor = await prisma.user.findFirst({
    where: { role: { code: "physician" }, isActive: true },
    select: { id: true },
  });
  if (!doctor) {
    const physicianRole = await prisma.role.findUnique({ where: { code: "physician" } });
    if (!physicianRole) throw new Error("physician role missing");
    await auth.api.signUpEmail({
      body: {
        email: "physician@clinic.local",
        password: "Doctor@12345",
        name: "Dr. Yousef Al-Absi",
        nameAr: "د. يوسف العبسي",
        roleId: physicianRole.id,
        currentClinicId: clinic.id,
        clinicId: clinic.id,
      },
    });
    const created = await prisma.user.findUnique({ where: { email: "physician@clinic.local" } });
    if (!created?.id) throw new Error("physician creation failed");
    doctor = { id: created.id };
    console.log("Physician created: physician@clinic.local / Doctor@12345");
  }

  const admin = await prisma.user.findFirst({
    where: { role: { code: "super_admin" } },
    select: { id: true },
  });
  const weekStart = startOfWeek(new Date());
  const todayIndex = new Date().getUTCDay() === 0 ? 6 : new Date().getUTCDay() - 1;
  const todayIso = toISODate(new Date());
  const department = await prisma.department.findFirst({
    where: { clinicId: clinic.id },
    select: { id: true },
  });

  let created = 0;
  for (const s of SLOTS) {
    const patientId = patientById.get(s.mrn);
    if (!patientId) continue;
    const dayDate = new Date(
      Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + s.day),
    );
    const iso = toISODate(dayDate);
    const start = new Date(`${iso}T${s.hh}:${s.mm}:00Z`);
    const end = new Date(start.getTime() + s.duration * 60_000);
    await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId,
        doctorId: doctor.id,
        departmentId: department?.id ?? null,
        startTime: start,
        endTime: end,
        durationMinutes: s.duration,
        type: s.type,
        reason: s.reason,
        status: statusFor(s.day, todayIndex),
        createdBy: admin?.id ?? doctor.id,
        updatedBy: admin?.id ?? doctor.id,
      },
    });
    created++;
    console.log(
      `- ${iso} ${s.hh}:${s.mm} ${s.mrn} (${s.type}, ${statusFor(s.day, todayIndex)})`,
    );
  }
  console.log(`Done: ${created} demo appointments for week starting ${toISODate(weekStart)} (today=${todayIso})`);
}

demoAppointments()
  .catch((err) => {
    console.error("Demo failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });