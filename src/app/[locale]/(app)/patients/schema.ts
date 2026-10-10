import { z } from "zod";

export const patientFormSchema = z.object({
  firstNameAr: z.string().trim().min(1, "required"),
  secondNameAr: z.string().trim().optional(),
  lastNameAr: z.string().trim().min(1, "required"),
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate: z.string().optional(),
  phone: z.string().trim().optional(),
  phone2: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  insuranceCompany: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const GOVERNORATES = [
  "أمانة العاصمة صنعاء",
  "محافظة صنعاء",
  "عدن",
  "تعز",
  "إب",
  "الحديدة",
  "حضرموت",
  "لحج",
  "أبين",
  "شبوة",
  "المهرة",
  "أرخبيل سقطرى",
  "مأرب",
  "الجوف",
  "البيضاء",
  "الضالع",
  "ذمار",
  "عمران",
  "صعدة",
  "حجة",
  "المحويت",
  "ريمة",
] as const;

export const INSURANCE_COMPANIES = [
  "كاك للتأمين",
  "المتخصصة للتأمين الصحي MIS",
  "الحياة للتأمين الصحي",
  "المتحدة للتأمين",
  "أمان للتأمين",
  "الشركة اليمنية العامة للتأمين",
  "ترست يمن للتأمين",
  "الشركة الإسلامية اليمنية للتأمين",
  "الشركة اليمنية القطرية للتأمين",
  "الشركة الوطنية للتأمين",
  "شركة هاي كير للتأمين الصحي",
  "فور هيلث للتأمين الصحي",
  "الشركة العالمية للتأمين الصحي",
] as const;