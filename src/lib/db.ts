import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient() {
  // The pg driver adapter always defaults to `public`, ignoring Prisma's
  // ?schema= URL convention (only the migrate CLI reads that). Pass the schema
  // explicitly so an org's own database and the platform's demo schemas both
  // resolve their tables the same way the Prisma models do.
  const adapter = new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    {
      schema:
        process.env.DATABASE_SCHEMA ??
        new URL(process.env.DATABASE_URL ?? "").searchParams.get("schema") ??
        undefined,
    },
  );
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}