import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/core/auth/server";

/**
 * Signs a platform user into this organization's own copy of the system.
 *
 * The platform runs one process per organization, and that process has its own
 * database with its own `User` table — it cannot read the platform's session.
 * So on the first request the platform sends a short-lived signed statement of
 * who is asking (`x-bos-gateway-token`); this route verifies it, makes sure a
 * local user exists for that person, and issues one of this system's own
 * session cookies. After that the browser carries `clinicos_session` and this
 * route is never called again.
 *
 * The token is only ever accepted over a loopback connection from the platform,
 * and it is signed with a secret this process was started with, so a request
 * that did not come through the platform's proxy cannot forge one.
 *
 * ## Why this is not a bcrypt mirror like the other systems
 *
 * This app signs people in with Better Auth, whose credential digest is scrypt
 * and cannot be produced from the platform's own digest. So instead of handing
 * over a password, this route proves identity with the signed token and then
 * mints a real Better Auth session for the matched local user — a fresh random
 * password is written to their credential account and immediately used to sign
 * in, so the value never leaves this function.
 */

export const dynamic = "force-dynamic";

interface Claims {
  v: 1;
  organizationId: string;
  organizationSlug: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

/**
 * Platform role -> this system's `Role.code`.
 *
 * A clinic has no read-only role, so `member` lands on RECEPTIONIST, the
 * least-privileged key that still gets someone through the door, and `viewer`
 * lands on AUDITOR, which can read but not write. An org that wants a genuine
 * role should extend this map; inventing a code here would create a role the
 * UI has no permissions for.
 */
const ROLE_MAP: Record<string, string> = {
  owner: "super_admin",
  admin: "manager",
  manager: "manager",
  member: "receptionist",
  cashier: "cashier",
  accountant: "accountant",
  viewer: "auditor",
};

const DEFAULT_ROLE_CODE = "receptionist";

function verify(token: string | null, secret: string): Claims | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Claims;
    if (claims.v !== 1) return null;
    if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null;
    // The token names one organization; this process belongs to exactly one, so
    // a token minted for a different org must never be honoured here.
    if (process.env.BOS_ORG_ID && claims.organizationId !== process.env.BOS_ORG_ID) return null;
    return claims;
  } catch {
    return null;
  }
}

/**
 * A local username for a platform account.
 *
 * The username plugin only accepts `[a-zA-Z0-9_.]`, so an email cannot be the
 * username. The platform user id is stable, so it is the seed instead.
 */
function usernameFor(claims: Claims): string {
  const id = claims.userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `platform_${id.slice(0, 20)}`;
}

/** Writes a known password into the user's credential account, creating it if needed. */
async function ensureCredential(userId: string, password: string): Promise<void> {
  const hashed = await hashPassword(password);
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
    select: { id: true },
  });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });
  } else {
    await prisma.account.create({
      data: { accountId: userId, providerId: "credential", userId, password: hashed },
    });
  }
}

/** Splits a possibly comma-joined `Set-Cookie` header into individual cookies. */
function splitSetCookie(value: string | null): string[] {
  if (!value) return [];
  return value.split(/,(?=\s*[^=;,\s]+=[^;]*)/).map((part) => part.trim()).filter(Boolean);
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.BOS_GATEWAY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: { code: "NOT_CONFIGURED" } }, { status: 501 });
  }

  const claims = verify(request.headers.get("x-bos-gateway-token"), secret);
  if (!claims) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const roleCode = ROLE_MAP[claims.role] ?? DEFAULT_ROLE_CODE;
  const role = await prisma.role.findUnique({ where: { code: roleCode }, select: { id: true } });
  if (!role) {
    // Roles come from `prisma/bootstrap.ts`. Without one there is no permission
    // set to attach, so refuse rather than create a user that would silently
    // have no access.
    return NextResponse.json({ error: { code: "ROLE_MISSING", role: roleCode } }, { status: 503 });
  }

  const email = (claims.email || `platform-${claims.userId}@platform.local`).toLowerCase();
  const name = claims.name || email;
  const clinic = await prisma.clinic.findUnique({ where: { code: "MAIN" }, select: { id: true } });

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, roleId: true, isActive: true, currentClinicId: true },
  });
  if (existing && !existing.isActive) {
    return NextResponse.json({ error: { code: "USER_DISABLED" } }, { status: 403 });
  }

  // A fresh secret per link: it never leaves this function, and it is what the
  // sign-in below authenticates with.
  const password = randomBytes(24).toString("base64url");

  try {
    if (existing) {
      const patch: { roleId?: string; currentClinicId?: string } = {};
      // A role change on the platform must be reflected here, otherwise a
      // demoted owner would keep the access they had when they first signed in.
      if (existing.roleId !== role.id) patch.roleId = role.id;
      if (!existing.currentClinicId && clinic) patch.currentClinicId = clinic.id;
      if (Object.keys(patch).length) {
        await prisma.user.update({ where: { id: existing.id }, data: patch });
      }
      await ensureCredential(existing.id, password);
    } else {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          username: usernameFor(claims),
          roleId: role.id,
          ...(clinic ? { clinicId: clinic.id, currentClinicId: clinic.id } : {}),
        },
      });
    }

    const signIn = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    const response = NextResponse.json(
      { ok: true, org: claims.organizationSlug, passwordMirrored: false },
      { status: signIn.status, headers: { "cache-control": "no-store" } },
    );
    for (const cookie of splitSetCookie(signIn.headers.get("set-cookie"))) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  } catch (err) {
    console.error("[bos/link] provisioning failed", err);
    return NextResponse.json({ error: { code: "PROVISION_FAILED" } }, { status: 500 });
  }
}
