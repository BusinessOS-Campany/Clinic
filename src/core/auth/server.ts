import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
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