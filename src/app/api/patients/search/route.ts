import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/core/auth/server";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { PATIENT_SELECT, buildPatientWhere } from "@/lib/patients-query";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const roleId = session?.user ? (session.user as { roleId?: string }).roleId ?? "" : "";
  if (!session?.user || !(await can({ id: session.user.id, roleId }, "patients:read"))) {
    return NextResponse.json({ items: [] }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const clinicId = (session.user as { currentClinicId?: string | null }).currentClinicId ?? "";
  if (!clinicId || !q) return NextResponse.json({ items: [] });

  const items = await prisma.patient.findMany({
    where: buildPatientWhere(clinicId, { q, status: "all" }),
    select: PATIENT_SELECT,
    orderBy: [{ lastNameAr: "asc" }, { firstNameAr: "asc" }],
    take: 10,
  });

  return NextResponse.json({ items });
}