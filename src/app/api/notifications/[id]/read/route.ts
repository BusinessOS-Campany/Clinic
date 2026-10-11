import { NextResponse } from "next/server";
import { requireUser } from "@/core/auth/session";
import { prisma } from "@/lib/db";

/** POST /api/notifications/[id]/read - Mark notification as read */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, clinicId: user.currentClinicId ?? undefined, recipientId: user.id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (notification.readAt) {
      return NextResponse.json({ ok: true, alreadyRead: true });
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}