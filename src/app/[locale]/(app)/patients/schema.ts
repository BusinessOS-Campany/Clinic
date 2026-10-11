import { z } from "zod";

export const CITIES = [
  "AMANAT_SANA_A",
  "SANA_A",
  "ADEN",
  "TAIZ",
  "IBB",
  "HODEIDAH",
  "HADRAMOUT",
  "LAHJ",
  "ABYAN",
  "SHABWAH",
  "AL_MAHRAH",
  "SOCOTRA",
  "MARIB",
  "AL_JAWF",
  "AL_BAYDA",
  "AL_DHALIL",
  "DHAMAR",
  "AMRAN",
  "SAADA",
  "HAJJAH",
  "AL_MAHWIT",
  "RAYMAH",
] as const;

export const patientFormSchema = z.object({
  firstNameAr: z.string().trim().min(1, "required"),
  secondNameAr: z.string().trim().optional(),
  lastNameAr: z.string().trim().min(1, "required"),
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate: z.string().optional(),
  phone: z.string().trim().optional(),
  phone2: z.string().trim().optional(),
  nationalId: z.string().trim().optional(),
  price: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ message: "required" }).min(0, "required").max(100_000_000, "required"),
  ),
  city: z.enum(CITIES).optional(),
  notes: z.string().trim().optional(),
});

export type PatientFormInput = z.input<typeof patientFormSchema>;
export type PatientFormValues = z.output<typeof patientFormSchema>;