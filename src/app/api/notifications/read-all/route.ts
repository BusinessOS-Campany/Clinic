import { NextResponse } from "next/server";
import { requireUser } from "@/core/auth/session";
import { prisma } from "@/lib/db";

/** POST /api/notifications/read-all - Mark all notifications as read */
export async function POST() {
  try {
    const user = await requireUser();
    const clinicId = user.currentClinicId;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic context" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        clinicId,
        recipientId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}