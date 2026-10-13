import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/db";

/**
 * The cookie this system issues its session under.
 *
 * The platform's runtime proxy reads this exact name out of the `Set-Cookie`
 * that `/api/bos/link` returns, so it can replay the session on later requests.
 * It is declared here — rather than left as Better Auth's default
 * `better-auth.session_token` — because the platform discovers a system's
 * cookie name from a `SESSION_COOKIE = "…"` declaration, which cannot express a
 * name containing a dot.
 */
export const SESSION_COOKIE = "clinicos_session";

/**
 * The mount point this app is served under, so Better Auth's routes and links
 * line up with Next's `basePath` (see `next.config.ts`).
 */
const basePath = `${process.env.SYSTEM_BASE_PATH ?? ""}/api/auth`;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  basePath,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  advanced: {
    cookies: {
      session_token: { name: SESSION_COOKIE },
    },
  },
  plugins: [username()],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 4,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      roleId: {
        type: "string",
        required: true,
        defaultValue: "",
      },
      nameAr: {
        type: "string",
        required: false,
      },
      nameEn: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      clinicId: {
        type: "string",
        required: false,
      },
      currentClinicId: {
        type: "string",
        required: false,
      },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});