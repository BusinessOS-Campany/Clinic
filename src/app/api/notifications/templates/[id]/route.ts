import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";

/** GET /api/notifications/templates/[id] - Get template */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("notifications:manage");
    const { id } = await params;

    const template = await prisma.notificationTemplate.findFirst({
      where: { id, clinicId: user.currentClinicId ?? undefined },
      include: {
        _count: { select: { notifications: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

/** PUT /api/notifications/templates/[id] - Update template */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("notifications:manage");
    const { id } = await params;
    const body = await request.json();

    const template = await prisma.notificationTemplate.findFirst({
      where: { id, clinicId: user.currentClinicId ?? undefined },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        subject: body.subject,
        subjectAr: body.subjectAr,
        subjectEn: body.subjectEn,
        body: body.body,
        bodyAr: body.bodyAr,
        bodyEn: body.bodyEn,
        variables: body.variables,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ ok: true, template: updated });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

/** DELETE /api/notifications/templates/[id] - Delete template */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("notifications:manage");
    const { id } = await params;

    const template = await prisma.notificationTemplate.findFirst({
      where: { id, clinicId: user.currentClinicId ?? undefined },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.isSystem) {
      return NextResponse.json({ error: "Cannot delete system template" }, { status: 400 });
    }

    await prisma.notificationTemplate.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}