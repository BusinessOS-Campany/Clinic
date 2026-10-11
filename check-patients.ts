import { prisma } from "./src/lib/db";

const patients = await prisma.patient.findMany({ select: { id: true, mrn: true, firstNameAr: true } });
console.log("Patients:", patients);
await prisma.$disconnect();