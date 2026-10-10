import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/core/auth/server";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { patientSearchOr } from "@/lib/search";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const roleId = session?.user ? (session.user as { roleId?: string }).roleId ?? "" : "";
  if (!session?.user || !(await can({ id: session.user.id, roleId }, "patients:read"))) {
    return NextResponse.json({ items: [] }, { status: 403 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const clinicId = (session.user as { currentClinicId?: string | null }).currentClinicId ?? "";

  const items = await prisma.patient.findMany({
    where: {
      clinicId,
      mergedIntoId: null,
      status: "ACTIVE",
      AND: q ? [{ OR: patientSearchOr(q) }] : [],
    },
    select: {
      id: true,
      mrn: true,
      patientId: true,
      firstNameAr: true,
      secondNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
      gender: true,
      birthDate: true,
      phone: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ items });
}
