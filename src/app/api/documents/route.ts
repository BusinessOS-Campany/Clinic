import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/core/auth/server";
import { can } from "@/core/rbac";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import {
  MAX_DOCUMENT_SIZE,
  saveDocumentBuffer,
} from "@/lib/documents/storage";

const CATEGORIES = new Set([
  "IDENTITY",
  "MEDICAL_REPORT",
  "IMAGING",
  "LABORATORY",
  "CONSENT",
  "INVOICE",
  "OTHER",
]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as
    | { id: string; roleId?: string; currentClinicId?: string | null }
    | undefined;
  if (
    !session?.user ||
    !user?.id ||
    !(await can({ id: user.id, roleId: user.roleId ?? "" }, "patients:write"))
  ) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const clinicId = user.currentClinicId ?? null;
  if (!clinicId) {
    return NextResponse.json({ ok: false, error: "no-clinic" }, { status: 400 });
  }

  const form = await request.formData();
  const patientId = String(form.get("patientId") ?? "").trim();
  const file = form.get("file");
  const category = String(form.get("category") ?? "OTHER").trim();
  const notes = String(form.get("notes") ?? "").trim();

  if (!patientId || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  if (file.size > MAX_DOCUMENT_SIZE || file.size === 0) {
    return NextResponse.json({ ok: false, error: "too-large" }, { status: 413 });
  }
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true, mrn: true },
  });
  if (!patient) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = saveDocumentBuffer(patientId, file.name, buffer);

  const doc = await prisma.patientDocument.create({
    data: {
      clinicId,
      patientId,
      category: category as never,
      fileName: file.name,
      storageKey,
      mimeType: file.type || null,
      sizeBytes: file.size,
      notes: notes || null,
      uploadedBy: user.id,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "PatientDocument",
    entityId: doc.id,
    clinicId,
    metadata: { patientId, mrn: patient.mrn, mimeType: file.type, sizeBytes: file.size },
  });
  revalidatePath(`/patients/${patientId}`);

  return NextResponse.json({ ok: true, id: doc.id });
}