import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import type { NotificationChannel, NotificationCategory } from "@/lib/generated/prisma/client";

/** GET /api/notifications/preferences - Get user preferences */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const clinicId = user.currentClinicId;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic context" }, { status: 400 });
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: { clinicId, userId: user.id },
    });

    const consents = await prisma.notificationConsent.findMany({
      where: { clinicId, userId: user.id },
    });

    return NextResponse.json({ preferences, consents });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

/** PUT /api/notifications/preferences - Update preferences */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    const clinicId = user.currentClinicId;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic context" }, { status: 400 });
    }

    const body = await request.json();
    const { preferences, consents } = body;

    // Update preferences
    if (preferences && Array.isArray(preferences)) {
      for (const pref of preferences) {
        const { category, channel, enabled, frequency, quietHoursStart, quietHoursEnd } = pref;
        if (!category || !channel) continue;

        await prisma.notificationPreference.upsert({
          where: {
            clinicId_userId_category_channel: {
              clinicId,
              userId: user.id,
              category,
              channel,
            },
          },
          create: {
            clinicId,
            userId: user.id,
            category,
            channel,
            enabled: enabled ?? true,
            frequency,
            quietHoursStart,
            quietHoursEnd,
          },
          update: {
            enabled: enabled ?? true,
            frequency,
            quietHoursStart,
            quietHoursEnd,
          },
        });
      }
    }

    // Update consents
    if (consents && Array.isArray(consents)) {
      for (const consent of consents) {
        const { channel, consented } = consent;
        if (!channel) continue;

        await prisma.notificationConsent.upsert({
          where: {
            clinicId_userId_channel: {
              clinicId,
              userId: user.id,
              channel,
            },
          },
          create: {
            clinicId,
            userId: user.id,
            channel,
            consented: consented ?? true,
            source: "PROFILE",
          },
          update: {
            consented: consented ?? true,
            revokedAt: consented ? null : new Date(),
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}