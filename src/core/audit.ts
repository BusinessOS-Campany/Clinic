import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export type AuditAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "sign"
  | "amend"
  | "export"
  | "print"
  | "login"
  | "logout"
  | "post"
  | "reverse"
  | "refund"
  | "verify"
  | "report";

export type AuditContext = {
  actorId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  clinicId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Records an audit entry. Fire-and-forget so failures never break the
 * primary operation; failures are logged, not thrown.
 */
export function recordAudit(ctx: AuditContext) {
  void prisma.auditLog
    .create({
      data: {
        actorId: ctx.actorId ?? null,
        action: ctx.action,
        entity: ctx.entity,
        entityId: ctx.entityId ?? null,
        metadata: (ctx.metadata ??
          undefined) as unknown as Prisma.InputJsonValue | undefined,
        clinicId: ctx.clinicId ?? null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[audit] failed to persist:", err);
    });
}