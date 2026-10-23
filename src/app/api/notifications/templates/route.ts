import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import type { NotificationCategory, NotificationChannel } from "@/lib/generated/prisma/client";

/** GET /api/notifications/templates - List templates */
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission("notifications:manage");
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const category = searchParams.get("category");
    const channel = searchParams.get("channel");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {
      clinicId: user.currentClinicId,
    };

    if (category) where.category = category;
    if (channel) where.channel = channel;
    if (isActive !== null) where.isActive = isActive === "true";

    const [templates, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { notifications: true } },
        },
      }),
      prisma.notificationTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

/** POST /api/notifications/templates - Create template */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("notifications:manage");
    const clinicId = user.currentClinicId;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic context" }, { status: 400 });
    }

    const body = await request.json();
    const {
      category,
      channel,
      name,
      nameAr,
      nameEn,
      subject,
      subjectAr,
      subjectEn,
      body: templateBody,
      bodyAr,
      bodyEn,
      variables,
      isSystem = false,
      maxRetries = 3,
      baseDelayMinutes,
      maxDelayMinutes,
      backoffMultiplier,
      jitterPercent,
    } = body;

    if (!category || !channel || !name || !nameAr || !nameEn || !templateBody || !bodyAr || !bodyEn) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.notificationTemplate.findUnique({
      where: { clinicId_category_channel: { clinicId, category, channel } },
    });
    if (existing) {
      return NextResponse.json({ error: "Template already exists for this category and channel" }, { status: 409 });
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        clinicId,
        category,
        channel,
        name,
        nameAr,
        nameEn,
        subject,
        subjectAr,
        subjectEn,
        body,
        bodyAr,
        bodyEn,
        variables,
        isSystem,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ ok: true, template });
  } catch (error) {
    if (error instanceof Error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}