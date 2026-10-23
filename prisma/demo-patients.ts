import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { code: "MAIN" } });
  if (!clinic) throw new Error("MAIN clinic not found");

  const existing = await prisma.patient.count({ where: { clinicId: clinic.id } });
  if (existing > 0) {
    console.log(`Skipping: ${existing} patients already exist`);
    return;
  }

  const seq = await prisma.numberSequence.update({
    where: { clinicId_key: { clinicId: clinic.id, key: "PATIENT" } },
    data: { currentValue: { increment: 7 } },
  });

  const items = [
    { mrn: "P00001", ar1: "أحمد", ar2: "الشمري", en1: "Ahmed", en2: "Al-Shamari", gender: "MALE", birth: "1985-05-14", phone: "777111222", bloodType: "O_POS", marital: "MARRIED" },
    { mrn: "P00002", ar1: "فاطمة", ar2: "الحدادي", en1: "Fatima", en2: "Al-Haddadi", gender: "FEMALE", birth: "1992-11-02", phone: "733444555", bloodType: "A_NEG", marital: "SINGLE" },
    { mrn: "P00003", ar1: "محمد", ar2: "اليزيدي", en1: "Mohammed", en2: "Al-Yazidi", gender: "MALE", birth: "1978-03-21", phone: "771222333", bloodType: "B_POS", marital: "MARRIED" },
    { mrn: "P00004", ar1: "نور", ar2: "الحكيمي", en1: "Noor", en2: "Al-Hakimi", gender: "FEMALE", birth: "2001-07-30", phone: "735111999", bloodType: "O_NEG", marital: "SINGLE" },
    { mrn: "P00005", ar1: "علي", ar2: "المخلافي", en1: "Ali", en2: "Al-Mekhlafi", gender: "MALE", birth: "1959-12-10", phone: "778333444", bloodType: "AB_POS", marital: "MARRIED" },
    { mrn: "P00006", ar1: "هند", ar2: "السامعي", en1: "Hind", en2: "Al-Sameai", gender: "FEMALE", birth: "1988-09-17", phone: "734222111", bloodType: "A_POS", marital: "DIVORCED" },
    { mrn: "P00007", ar1: "يوسف", ar2: "الرميمي", en1: "Yousef", en2: "Al-Rimimi", gender: "MALE", birth: "2015-02-08", phone: "770555666", bloodType: "O_POS", marital: "UNKNOWN" },
  ];

  for (const it of items) {
    await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        mrn: it.mrn,
        firstNameAr: it.ar1,
        lastNameAr: it.ar2,
        firstNameEn: it.en1,
        lastNameEn: it.en2,
        gender: it.gender as "MALE" | "FEMALE",
        birthDate: new Date(`${it.birth}T00:00:00.000Z`),
        phone: it.phone,
        bloodType: it.bloodType as never,
        maritalStatus: it.marital as never,
        status: "ACTIVE",
      },
    });
  }
  console.log(`Inserted ${items.length} demo patients. Sequence now ${seq.currentValue}`);
}

main().finally(() => prisma.$disconnect());