import "dotenv/config";
import { prisma } from "../src/lib/db";

const LAB_TESTS: {
  code: string;
  ar: string;
  en: string;
  category: string;
  unit: string;
  ref: string;
  price: number;
}[] = [
  { code: "CBC", ar: "صورة دم كاملة", en: "Complete Blood Count", category: "HEMATOLOGY", unit: "×10^9/L", ref: "WBC 4–11", price: 5000 },
  { code: "GLU", ar: "سكر صائم", en: "Fasting Glucose", category: "CHEMISTRY", unit: "mg/dL", ref: "70–110", price: 1500 },
  { code: "TSH", ar: "هرمون الغدة الدرقية", en: "TSH", category: "HORMONES", unit: "mIU/L", ref: "0.4–4.0", price: 8000 },
  { code: "CRP", ar: "بروتين سي التفاعلي", en: "C-Reactive Protein", category: "CHEMISTRY", unit: "mg/L", ref: "<5", price: 6000 },
  { code: "UA", ar: "تحليل بول", en: "Urinalysis", category: "URINE", unit: "", ref: "Negative", price: 3000 },
];

const ITEMS: {
  code: string;
  ar: string;
  en: string;
  category: string;
  unit: string;
  qty: number;
  reorder: number;
  price: number;
  supplier: string;
}[] = [
  { code: "MED-PARA-500", ar: "باراسيتامول 500مغ", en: "Paracetamol 500mg", category: "MEDICINE", unit: "tab", qty: 500, reorder: 100, price: 120, supplier: "PharmaYemen" },
  { code: "MED-AMOX-250", ar: "أموكسيسيلين 250مغ", en: "Amoxicillin 250mg", category: "MEDICINE", unit: "cap", qty: 300, reorder: 80, price: 180, supplier: "PharmaYemen" },
  { code: "SUP-SAL-500", ar: "محلول ملحي 500مل", en: "Normal Saline 500ml", category: "SUPPLY", unit: "bag", qty: 80, reorder: 30, price: 900, supplier: "MedSupply Co." },
  { code: "SUP-SYR-5", ar: "سرنجة 5مل", en: "Syringe 5ml", category: "SUPPLY", unit: "pc", qty: 250, reorder: 60, price: 60, supplier: "MedSupply Co." },
];

const ICD10_CODES: { code: string; nameAr: string; nameEn: string; category: string }[] = [
  { code: "M54.5", nameAr: "ألم أسفل الظهر", nameEn: "Low back pain", category: "Musculoskeletal" },
  { code: "E11.9", nameAr: "داء السكري من النوع 2", nameEn: "Type 2 diabetes mellitus", category: "Endocrine" },
  { code: "I10", nameAr: "ارتفاع ضغط الدم الأساسي", nameEn: "Essential hypertension", category: "Cardiovascular" },
  { code: "R50.9", nameAr: "حمى", nameEn: "Fever", category: "General" },
  { code: "J45", nameAr: "الربو", nameEn: "Asthma", category: "Respiratory" },
  { code: "I20.9", nameAr: "ذبحة صدرية غير محددة", nameEn: "Angina pectoris", category: "Cardiovascular" },
  { code: "J06.9", nameAr: "عدوى تنفسية حادة", nameEn: "Acute upper respiratory infection", category: "Respiratory" },
  { code: "K59.1", nameAr: "إمساك وظيفي", nameEn: "Functional constipation", category: "Digestive" },
  { code: "N39.0", nameAr: "عدوى المسالك البولية", nameEn: "Urinary tract infection", category: "Genitourinary" },
  { code: "L20.9", nameAr: "التهاب الجلد التأتبي", nameEn: "Atopic dermatitis", category: "Skin" },
];

const DIAGNOSES: { icd: string; name: string }[] = [
  { icd: "M54.5", name: "Low back pain" },
  { icd: "E11.9", name: "Type 2 diabetes mellitus" },
  { icd: "I10", name: "Essential hypertension" },
  { icd: "R50.9", name: "Fever" },
  { icd: "J45", name: "Asthma" },
];

const IV: { kind: "SERVICE" | "MEDICATION" | "LABORATORY" | "IMAGING"; desc: string; qty: number; price: number }[] = [
  { kind: "SERVICE", desc: "Consultation", qty: 1, price: 15000 },
  { kind: "LABORATORY", desc: "Fasting Glucose", qty: 1, price: 1500 },
  { kind: "MEDICATION", desc: "Paracetamol 500mg ×20", qty: 20, price: 120 },
  { kind: "SERVICE", desc: "Nursing care", qty: 1, price: 5000 },
];

async function demoOps() {
  const clinic = await prisma.clinic.findFirst({ where: { code: "MAIN" } });
  if (!clinic) throw new Error("MAIN clinic missing — run db:seed first");

  // Idempotent: wipe previous demo-ops output for demo patients, then re-create.
  const demoPatients = await prisma.patient.findMany({
    where: { clinicId: clinic.id, mrn: { startsWith: "P" } },
    select: { id: true, mrn: true },
  });
  const patientIds = demoPatients.map((p) => p.id);
  if (patientIds.length) {
    await prisma.payment.deleteMany({ where: { invoice: { patientId: { in: patientIds }, clinicId: clinic.id } } });
    await prisma.invoiceItem.deleteMany({ where: { invoice: { patientId: { in: patientIds }, clinicId: clinic.id } } });
    await prisma.invoice.deleteMany({ where: { patientId: { in: patientIds }, clinicId: clinic.id } });
    await prisma.labResult.deleteMany({ where: { request: { patientId: { in: patientIds }, clinicId: clinic.id } } });
    await prisma.labRequest.deleteMany({ where: { patientId: { in: patientIds }, clinicId: clinic.id } });
    await prisma.imagingRequest.deleteMany({ where: { patientId: { in: patientIds }, clinicId: clinic.id } });
    await prisma.dispensation.deleteMany({ where: { patientId: { in: patientIds }, clinicId: clinic.id } });
    await prisma.medicalOrder.deleteMany({ where: { patientId: { in: patientIds }, clinicId: clinic.id } });
    await prisma.encounterDiagnosis.deleteMany({ where: { encounter: { patientId: { in: patientIds }, clinicId: clinic.id } } });
    await prisma.encounter.deleteMany({ where: { patientId: { in: patientIds }, clinicId: clinic.id } });
    const demoItems = await prisma.inventoryItem.findMany({
      where: { clinicId: clinic.id, code: { in: ITEMS.map((i) => i.code) } },
      select: { id: true },
    });
    const demoItemIds = demoItems.map((i) => i.id);
    if (demoItemIds.length) {
      await prisma.inventoryMovement.deleteMany({ where: { itemId: { in: demoItemIds } } });
      await prisma.inventoryItem.deleteMany({ where: { id: { in: demoItemIds } } });
    }
    console.log(`Cleaned previous demo-ops data (${patientIds.length} patients).`);
  }

  const doctor = await prisma.user.findFirst({
    where: { role: { code: "physician" }, isActive: true },
    select: { id: true, name: true },
  });
  const pharmacist = await prisma.user.findFirst({ where: { role: { code: "pharmacist" } }, select: { id: true } });
  const labTech = await prisma.user.findFirst({ where: { role: { code: "lab_tech" } }, select: { id: true } });
  const labReviewer = await prisma.user.findFirst({ where: { role: { code: "lab_reviewer" } }, select: { id: true } });
  const inventory = await prisma.user.findFirst({ where: { role: { code: "inventory" } }, select: { id: true } });
  const issueId = pharmacist?.id ?? labTech?.id ?? inventory?.id ?? doctor?.id;
  if (!doctor?.id || !issueId) throw new Error("Missing staff roles — run db:seed first");

  // Lab tests catalog
  console.log("Lab tests...");
  for (const lt of LAB_TESTS) {
    await prisma.labTest.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: lt.code } },
      create: {
        clinicId: clinic.id,
        code: lt.code,
        nameAr: lt.ar,
        nameEn: lt.en,
        category: lt.category,
        unit: lt.unit,
        referenceRange: lt.ref,
        price: lt.price,
      },
      update: { nameAr: lt.ar, nameEn: lt.en, category: lt.category, unit: lt.unit, referenceRange: lt.ref, price: lt.price },
    });
  }

  // Inventory
  console.log("Inventory...");
  for (const it of ITEMS) {
    const item = await prisma.inventoryItem.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: it.code } },
      create: {
        clinicId: clinic.id,
        code: it.code,
        nameAr: it.ar,
        nameEn: it.en,
        category: it.category,
        unit: it.unit,
        reorderLevel: it.reorder,
        price: it.price,
        supplier: it.supplier,
      },
      update: { nameAr: it.ar, nameEn: it.en, category: it.category, reorderLevel: it.reorder },
    });
    const hasMovement = await prisma.inventoryMovement.findFirst({
      where: { itemId: item.id, type: "PURCHASE" },
      select: { id: true },
    });
    if (!hasMovement) {
      await prisma.inventoryMovement.create({
        data: {
          clinicId: clinic.id,
          itemId: item.id,
          type: "PURCHASE",
          quantity: it.qty,
          unitCost: it.price,
          reference: "Opening stock",
          movedBy: issueId,
        },
      });
      await prisma.inventoryItem.update({ where: { id: item.id }, data: { currentQty: it.qty } });
    }
  }

  // Encounters from demo appointments (mapping to lab request with results)
  const appointments = await prisma.appointment.findMany({
    where: { clinicId: clinic.id },
    include: { patient: { select: { id: true, mrn: true } } },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  const labTestByCode = new Map((await prisma.labTest.findMany({ where: { clinicId: clinic.id } })).map((l) => [l.code, l]));
  const paracetamol = await prisma.inventoryItem.findUnique({
    where: { clinicId_code: { clinicId: clinic.id, code: "MED-PARA-500" } },
  });

  // Diagnosis Catalog (ICD-10)
  console.log("Diagnosis Catalog (ICD-10)...");
  for (const icd of ICD10_CODES) {
    await prisma.diagnosisCatalog.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: icd.code } },
      create: {
        clinicId: clinic.id,
        code: icd.code,
        nameAr: icd.nameAr,
        nameEn: icd.nameEn,
        classification: "ICD10",
        category: icd.category,
        isStandard: true,
      },
      update: { nameAr: icd.nameAr, nameEn: icd.nameEn, category: icd.category },
    });
  }

  // Drug Catalog
  console.log("Drug Catalog...");
  const DRUGS = [
    { genericName: "Paracetamol", genericNameAr: "باراسيتامول", brandNames: "Panadol, Tylenol, Calpol", strength: "500mg", dosageForm: "TABLET", route: "ORAL", category: "Analgesic", atcCode: "N02BE01", maxDailyDose: 4000, maxSingleDose: 1000, pregnancyCategory: "B", isControlled: false },
    { genericName: "Amoxicillin", genericNameAr: "أموكسيسيلين", brandNames: "Amoxil, Trimox", strength: "250mg", dosageForm: "CAPSULE", route: "ORAL", category: "Antibiotic", atcCode: "J01CA04", maxDailyDose: 3000, maxSingleDose: 1000, pregnancyCategory: "B", isControlled: false },
    { genericName: "Ibuprofen", genericNameAr: "إيبوبروفين", brandNames: "Advil, Motrin, Nurofen", strength: "400mg", dosageForm: "TABLET", route: "ORAL", category: "NSAID", atcCode: "M01AE01", maxDailyDose: 3200, maxSingleDose: 800, pregnancyCategory: "C", isControlled: false },
    { genericName: "Omeprazole", genericNameAr: "أوميبرازول", brandNames: "Prilosec, Losec", strength: "20mg", dosageForm: "CAPSULE", route: "ORAL", category: "PPI", atcCode: "A02BC01", maxDailyDose: 40, maxSingleDose: 20, pregnancyCategory: "C", isControlled: false },
    { genericName: "Metformin", genericNameAr: "ميتفورمين", brandNames: "Glucophage", strength: "500mg", dosageForm: "TABLET", route: "ORAL", category: "Antidiabetic", atcCode: "A10BA02", maxDailyDose: 2550, maxSingleDose: 850, pregnancyCategory: "B", isControlled: false },
    { genericName: "Atorvastatin", genericNameAr: "أتورفاستاتين", brandNames: "Lipitor", strength: "20mg", dosageForm: "TABLET", route: "ORAL", category: "Statin", atcCode: "C10AA05", maxDailyDose: 80, maxSingleDose: 80, pregnancyCategory: "X", isControlled: false },
    { genericName: "Losartan", genericNameAr: "لوسارتان", brandNames: "Cozaar", strength: "50mg", dosageForm: "TABLET", route: "ORAL", category: "ARB", atcCode: "C09CA01", maxDailyDose: 100, maxSingleDose: 100, pregnancyCategory: "D", isControlled: false },
    { genericName: "Amlodipine", genericNameAr: "أملوديبين", brandNames: "Norvasc", strength: "5mg", dosageForm: "TABLET", route: "ORAL", category: "CCB", atcCode: "C08CA01", maxDailyDose: 10, maxSingleDose: 10, pregnancyCategory: "C", isControlled: false },
  ];

  const drugIdByGeneric: Map<string, string> = new Map();
  for (const d of DRUGS) {
    const drug = await prisma.drugCatalog.upsert({
      where: { clinicId_genericName_strength_dosageForm: { clinicId: clinic.id, genericName: d.genericName, strength: d.strength, dosageForm: d.dosageForm } },
      create: {
        clinicId: clinic.id,
        genericName: d.genericName,
        genericNameAr: d.genericNameAr,
        brandNames: d.brandNames,
        strength: d.strength,
        dosageForm: d.dosageForm,
        route: d.route,
        category: d.category,
        atcCode: d.atcCode,
        maxDailyDose: d.maxDailyDose,
        maxSingleDose: d.maxSingleDose,
        pregnancyCategory: d.pregnancyCategory,
        isControlled: d.isControlled,
        isActive: true,
      },
      update: { genericNameAr: d.genericNameAr, brandNames: d.brandNames, route: d.route, category: d.category, atcCode: d.atcCode },
    });
    drugIdByGeneric.set(d.genericName, drug.id);
  }

  // Drug Interactions
  console.log("Drug Interactions...");
  const INTERACTIONS = [
    { drug1: "Warfarin", drug2: "Ibuprofen", severity: "MAJOR", management: "Monitor INR closely; avoid NSAIDs if possible", evidenceLevel: "A" },
    { drug1: "Metformin", drug2: "Ibuprofen", severity: "MODERATE", management: "Monitor renal function", evidenceLevel: "B" },
    { drug1: "Lisinopril", drug2: "Ibuprofen", severity: "MODERATE", management: "Monitor renal function and potassium", evidenceLevel: "B" },
    { drug1: "Warfarin", drug2: "Amoxicillin", severity: "MODERATE", management: "Monitor INR", evidenceLevel: "B" },
    { drug1: "Simvastatin", drug2: "Amlodipine", severity: "MODERATE", management: "Limit simvastatin dose to 20mg daily", evidenceLevel: "A" },
  ];

  // Add warfarin, lisinopril, simvastatin to drug catalog for interactions
  const extraDrugs = [
    { genericName: "Warfarin", genericNameAr: "وارفارين", brandNames: "Coumadin", strength: "5mg", dosageForm: "TABLET", route: "ORAL", category: "Anticoagulant", atcCode: "B01AA03", maxDailyDose: 10, maxSingleDose: 10, pregnancyCategory: "X", isControlled: false },
    { genericName: "Lisinopril", genericNameAr: "ليسينوبريل", brandNames: "Prinivil, Zestril", strength: "10mg", dosageForm: "TABLET", route: "ORAL", category: "ACE Inhibitor", atcCode: "C09AA03", maxDailyDose: 40, maxSingleDose: 40, pregnancyCategory: "D", isControlled: false },
    { genericName: "Simvastatin", genericNameAr: "سيمفاستاتين", brandNames: "Zocor", strength: "20mg", dosageForm: "TABLET", route: "ORAL", category: "Statin", atcCode: "C10AA01", maxDailyDose: 80, maxSingleDose: 80, pregnancyCategory: "X", isControlled: false },
  ];

  for (const d of extraDrugs) {
    const drug = await prisma.drugCatalog.upsert({
      where: { clinicId_genericName_strength_dosageForm: { clinicId: clinic.id, genericName: d.genericName, strength: d.strength, dosageForm: d.dosageForm } },
      create: {
        clinicId: clinic.id,
        genericName: d.genericName,
        genericNameAr: d.genericNameAr,
        brandNames: d.brandNames,
        strength: d.strength,
        dosageForm: d.dosageForm,
        route: d.route,
        category: d.category,
        atcCode: d.atcCode,
        maxDailyDose: d.maxDailyDose,
        maxSingleDose: d.maxSingleDose,
        pregnancyCategory: d.pregnancyCategory,
        isControlled: d.isControlled,
        isActive: true,
      },
      update: {},
    });
    drugIdByGeneric.set(d.genericName, drug.id);
  }

  for (const ia of INTERACTIONS) {
    const id1 = drugIdByGeneric.get(ia.drug1);
    const id2 = drugIdByGeneric.get(ia.drug2);
    if (!id1 || !id2) continue;
    const [d1, d2] = id1 < id2 ? [id1, id2] : [id2, id1];
    await prisma.drugInteraction.upsert({
      where: { clinicId_drugId1_drugId2: { clinicId: clinic.id, drugId1: d1, drugId2: d2 } },
      create: {
        clinicId: clinic.id,
        drugId1: d1,
        drugId2: d2,
        severity: ia.severity as any,
        management: ia.management,
        evidenceLevel: ia.evidenceLevel,
        isActive: true,
      },
      update: { severity: ia.severity as any, management: ia.management, evidenceLevel: ia.evidenceLevel },
    });
  }

  console.log("Encounters + orders...");
  const encounterIds: string[] = [];
  for (const [i, a] of appointments.entries()) {
    const started = a.status === "COMPLETED" ? a.endTime : new Date(a.startTime.getTime() - 15 * 60_000);
    const encounter = await prisma.encounter.create({
      data: {
        clinicId: clinic.id,
        patientId: a.patientId,
        appointmentId: a.id,
        doctorId: doctor.id,
        type: a.type,
        status: a.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
        chiefComplaint: a.reason,
        subjective: "Patient reports onset of symptoms 3 days ago with gradual progression.",
        objective: "Conscious, alert. Vital signs within range on examination.",
        assessment: "Initial assessment recorded; plan noted below.",
        plan: "Rest, hydration, follow-up in 3 days, prescribed medications.",
        temperature: Math.round((36.5 + i * 0.3) * 10) / 10,
        pulse: 70 + i * 4,
        respRate: 16 + (i % 3),
        bpSystolic: 115 + i * 3,
        bpDiastolic: 72 + (i % 2) * 2,
        spO2: 96 + (i % 4),
        startedAt: started,
        completedAt: a.status === "COMPLETED" ? a.endTime : null,
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    });
    encounterIds.push(encounter.id);

    const diag = DIAGNOSES[i % DIAGNOSES.length]!;
    await prisma.encounterDiagnosis.create({
      data: { clinicId: clinic.id, encounterId: encounter.id, code: diag.icd, name: diag.name, isPrimary: true, createdBy: doctor.id },
    });

    if (i % 3 === 0 || i === 4) {
      // Lab order with results
      const order = await prisma.medicalOrder.create({
        data: {
          clinicId: clinic.id,
          encounterId: encounter.id,
          patientId: a.patientId,
          kind: "LABORATORY",
          name: "CBC + Fasting Glucose",
          status: a.status === "COMPLETED" ? "COMPLETED" : "PENDING",
          createdBy: doctor.id,
        },
      });
      const cbc = labTestByCode.get("CBC");
      const glu = labTestByCode.get("GLU");
      const req = await prisma.labRequest.create({
        data: {
          clinicId: clinic.id,
          orderId: order.id,
          patientId: a.patientId,
          requestedBy: doctor.id,
          status: a.status === "COMPLETED" ? "VERIFIED" : "PENDING",
        },
      });
      await prisma.labResult.createMany({
        data: [
          {
            requestId: req.id,
            testId: cbc?.id ?? null,
            testName: cbc?.nameEn ?? "CBC",
            unit: cbc?.unit ?? null,
            referenceRange: cbc?.referenceRange ?? null,
            resultValue: i % 3 === 0 ? "12.6" : "5.9",
            isAbnormal: i % 3 !== 0,
            status: a.status === "COMPLETED" ? "VERIFIED" : "PENDING",
            enteredBy: labTech?.id ?? issueId,
            verifiedBy: labReviewer?.id ?? issueId,
            verifiedAt: a.status === "COMPLETED" ? a.endTime : null,
          },
          {
            requestId: req.id,
            testId: glu?.id ?? null,
            testName: glu?.nameEn ?? "Fasting Glucose",
            unit: glu?.unit ?? null,
            referenceRange: glu?.referenceRange ?? null,
            resultValue: (90 + i * 9).toString(),
            isAbnormal: false,
            status: a.status === "COMPLETED" ? "VERIFIED" : "PENDING",
            enteredBy: labTech?.id ?? issueId,
            verifiedBy: labReviewer?.id ?? issueId,
            verifiedAt: a.status === "COMPLETED" ? a.endTime : null,
          },
        ],
      });
    } else if (i === 1) {
      // Imaging order with report
      const order = await prisma.medicalOrder.create({
        data: {
          clinicId: clinic.id,
          encounterId: encounter.id,
          patientId: a.patientId,
          kind: "IMAGING",
          name: "Chest X-Ray",
          status: a.status === "COMPLETED" ? "COMPLETED" : "PENDING",
          createdBy: doctor.id,
        },
      });
      await prisma.imagingRequest.create({
        data: {
          clinicId: clinic.id,
          orderId: order.id,
          patientId: a.patientId,
          modality: "XRAY",
          status: a.status === "COMPLETED" ? "REPORTED" : "PENDING",
          findings: a.status === "COMPLETED" ? "No acute cardiopulmonary findings." : null,
          requestedBy: doctor.id,
          reportedBy: doctor.id,
          reportedAt: a.status === "COMPLETED" ? a.endTime : null,
        },
      });
    } else {
      // Medication order + dispensation
      const order = await prisma.medicalOrder.create({
        data: {
          clinicId: clinic.id,
          encounterId: encounter.id,
          patientId: a.patientId,
          kind: "MEDICATION",
          name: "Paracetamol 500mg",
          dosage: "500mg",
          frequency: "3x daily",
          durationDays: 5,
          quantity: "20",
          unit: "tab",
          status: a.status === "COMPLETED" ? "COMPLETED" : "PENDING",
          dispensedAt: a.status === "COMPLETED" ? a.endTime : null,
          createdBy: doctor.id,
        },
      });
      if (paracetamol) {
        const qty = 20;
        await prisma.dispensation.create({
          data: {
            clinicId: clinic.id,
            orderId: order.id,
            patientId: a.patientId,
            medicationName: "Paracetamol 500mg",
            medicationCode: paracetamol.code,
            quantityDispensed: qty,
            unit: "tab",
            dispensedBy: pharmacist?.id ?? issueId,
            dispensedAt: a.status === "COMPLETED" ? a.endTime : new Date(),
            notes: "Take after meals.",
          },
        });
        await prisma.inventoryMovement.create({
          data: { clinicId: clinic.id, itemId: paracetamol.id, type: "DISPENSE", quantity: -qty, reference: `Order ${order.id}`, movedBy: pharmacist?.id ?? issueId },
        });
        await prisma.inventoryItem.update({
          where: { id: paracetamol.id },
          data: { currentQty: { decrement: qty } },
        });
      }
    }
  }

  // Billing: one paid invoice per completed encounter
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  if (completed.length) {
    console.log("Invoices...");
    let seq = await prisma.numberSequence.upsert({
      where: { clinicId_key: { clinicId: clinic.id, key: "INVOICE" } },
      create: { clinicId: clinic.id, key: "INVOICE", prefix: "INV", currentValue: 0n, padLength: 5 },
      update: { prefix: "INV" },
    });
    let num = seq.currentValue;
    for (const a of completed.slice(0, 2)) {
      num++;
      await prisma.numberSequence.update({
        where: { clinicId_key: { clinicId: clinic.id, key: "INVOICE" } },
        data: { currentValue: num },
      });
      const invoiceNo = `INV-${String(num).padStart(5, "0")}`;
      const total = IV.reduce((sum, l) => sum + l.qty * l.price, 0);
      const invoice = await prisma.invoice.create({
        data: {
          clinicId: clinic.id,
          patientId: a.patientId,
          invoiceNo,
          status: "PAID",
          subtotal: total,
          discount: 0,
          taxRate: 0,
          total,
          paidAmount: total,
          issuedBy: issueId,
        },
      });
      for (const line of IV) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            kind: line.kind,
            description: line.desc,
            quantity: line.qty,
            unitPrice: line.price,
            total: line.qty * line.price,
          },
        });
      }
      await prisma.payment.create({
        data: { invoiceId: invoice.id, method: "CASH", amount: total, receivedBy: issueId, paidAt: a.endTime },
      });
      console.log(`- ${invoiceNo} (${a.patient.mrn}) ${total}`);
    }
  }

  console.log(`Done: ${encounterIds.length} encounters, lab tests, inventory, dispensations, invoices.`);
}

demoOps()
  .catch((err) => {
    console.error("Demo failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });