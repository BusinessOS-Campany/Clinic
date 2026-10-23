-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('CONSULTATION', 'TREATMENT', 'PROCEDURE', 'LABORATORY', 'IMAGING', 'DENTAL', 'OPERATING_THEATER', 'RECOVERY', 'PHARMACY', 'WAITING', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('CONSULTATION_ROOM', 'TREATMENT_ROOM', 'PROCEDURE_ROOM', 'LABORATORY_EQUIPMENT', 'IMAGING_EQUIPMENT', 'DENTAL_CHAIR', 'MEDICAL_DEVICE', 'COMPUTER', 'MONITOR', 'INFUSION_PUMP', 'VENTILATOR', 'ANESTHESIA_MACHINE', 'ULTRASOUND', 'X_RAY', 'CT_SCANNER', 'MRI_SCANNER', 'ENDOSCOPE', 'LASER', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_ORDER', 'DECOMMISSIONED', 'RESERVED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION', 'CLEANING', 'SOFTWARE_UPDATE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "BranchReportType" AS ENUM ('FINANCIAL_SUMMARY', 'APPOINTMENT_UTILIZATION', 'RESOURCE_UTILIZATION', 'PATIENT_VOLUME', 'INVENTORY_STATUS', 'CASHIER_PERFORMANCE', 'CLINICAL_OUTCOMES', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('CONSULTATION', 'PROCEDURE', 'LABORATORY', 'IMAGING', 'PHARMACY', 'NURSING', 'PHYSIOTHERAPY', 'DENTAL', 'SURGERY', 'ANESTHESIA', 'VACCINATION', 'HEALTH_CHECK', 'TELEMEDICINE', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "City" AS ENUM ('AMANAT_SANA_A', 'SANA_A', 'ADEN', 'TAIZ', 'IBB', 'HODEIDAH', 'HADRAMOUT', 'LAHJ', 'ABYAN', 'SHABWAH', 'AL_MAHRAH', 'SOCOTRA', 'MARIB', 'AL_JAWF', 'AL_BAYDA', 'AL_DHALIL', 'DHAMAR', 'AMRAN', 'SAADA', 'HAJJAH', 'AL_MAHWIT', 'RAYMAH');

-- CreateEnum
CREATE TYPE "MergeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('INITIAL', 'FOLLOW_UP', 'CONSULTATION', 'VACCINATION', 'PROCEDURE', 'RE_EVALUATION');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'SIGNED', 'AMENDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('REGISTERED', 'TRIAGE', 'WAITING', 'IN_SERVICE', 'UNDER_EXAMINATION', 'AWAITING_RESULTS', 'AWAITING_REVIEW', 'COMPLETED', 'REFERRED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VisitSource" AS ENUM ('WALK_IN', 'APPOINTMENT');

-- CreateEnum
CREATE TYPE "QueueKind" AS ENUM ('TRIAGE', 'DOCTOR', 'LABORATORY', 'IMAGING', 'PHARMACY', 'BILLING', 'OTHER');

-- CreateEnum
CREATE TYPE "QueueEntryStatus" AS ENUM ('WAITING', 'CALLED', 'IN_PROGRESS', 'DONE', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('NEW', 'FOLLOW_UP', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "VisitPriority" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('SELF', 'DOCTOR', 'HOSPITAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('SUSPECTED', 'PROVISIONAL', 'CONFIRMED', 'RULED_OUT', 'RESOLVED', 'CHRONIC');

-- CreateEnum
CREATE TYPE "DiagnosisConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DiagnosisClassification" AS ENUM ('ICD10', 'ICD11', 'SNOMED_CT', 'LOCAL');

-- CreateEnum
CREATE TYPE "DiagnosisCourse" AS ENUM ('ACUTE', 'CHRONIC', 'RECURRENT');

-- CreateEnum
CREATE TYPE "Laterality" AS ENUM ('LEFT', 'RIGHT', 'BILATERAL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "MedicalOrderKind" AS ENUM ('MEDICATION', 'LABORATORY', 'IMAGING', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalOrderStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LabRequestStatus" AS ENUM ('PENDING', 'SAMPLED', 'IN_PROGRESS', 'RESULTED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabResultStatus" AS ENUM ('PENDING', 'RESULTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ImagingRequestStatus" AS ENUM ('PENDING', 'PERFORMED', 'REPORTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SpecimenStatus" AS ENUM ('ORDERED', 'COLLECTED', 'LABELED', 'RECEIVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SpecimenType" AS ENUM ('BLOOD', 'URINE', 'STOOL', 'SPUTUM', 'CSF', 'TISSUE', 'SWAB', 'OTHER');

-- CreateEnum
CREATE TYPE "LabAlertSeverity" AS ENUM ('WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ImagingReportStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'AMENDED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('PURCHASE', 'DISPENSE', 'ADJUST', 'RETURN', 'DAMAGE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "BillingItemKind" AS ENUM ('SERVICE', 'MEDICATION', 'LABORATORY', 'IMAGING', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalHistoryType" AS ENUM ('MEDICAL', 'SURGICAL', 'OBSTETRIC', 'FAMILY', 'SOCIAL', 'IMMUNIZATION');

-- CreateEnum
CREATE TYPE "AllergyType" AS ENUM ('DRUG', 'FOOD', 'ENVIRONMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "ProcedureStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PatientDocumentCategory" AS ENUM ('IDENTITY', 'MEDICAL_REPORT', 'IMAGING', 'LABORATORY', 'CONSENT', 'INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TREATMENT', 'PROCEDURE', 'ANESTHESIA', 'DATA_PROCESSING', 'TELEHEALTH', 'FINANCIAL');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('DRAFT', 'SIGNED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DRAWN', 'TYPED', 'PKI', 'BIOMETRIC');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'EXPIRED', 'DELETED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('MAJOR', 'MODERATE', 'MINOR');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('ALLERGY', 'DRUG_INTERACTION', 'DUPLICATE_THERAPY', 'DOSE_EXCEEDS_MAX', 'CONTRAINDICATION', 'PREGNANCY_WARNING', 'RENAL_ADJUSTMENT', 'HEPATIC_ADJUSTMENT', 'AGE_INAPPROPRIATE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'DISCREPANCY_FOUND');

-- CreateEnum
CREATE TYPE "ReconciliationSource" AS ENUM ('PATIENT_REPORTED', 'PREVIOUS_PRESCRIPTION', 'PHARMACY_RECORD', 'CLINICIAN_ENTERED');

-- CreateEnum
CREATE TYPE "ReconciliationAction" AS ENUM ('CONTINUE', 'DISCONTINUE', 'MODIFY', 'HOLD');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('SOAP', 'PROGRESS_NOTE', 'PROCEDURE_NOTE', 'CONSULTATION', 'DISCHARGE_SUMMARY', 'REFERRAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('APPOINTMENT_CONFIRMATION', 'APPOINTMENT_REMINDER', 'APPOINTMENT_CHANGE', 'FOLLOW_UP_REMINDER', 'LAB_RESULT', 'PRESCRIPTION_READY', 'PAYMENT_RECEIPT', 'BALANCE_REMINDER', 'CLINIC_ANNOUNCEMENT', 'STAFF_TASK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VitalType" AS ENUM ('TEMPERATURE', 'PULSE', 'RESP_RATE', 'BP_SYSTOLIC', 'BP_DIASTOLIC', 'SPO2', 'PAIN', 'GLUCOSE', 'BMI', 'HEIGHT', 'WEIGHT', 'HEAD_CIRCUMFERENCE');

-- CreateEnum
CREATE TYPE "VitalPosition" AS ENUM ('SITTING', 'STANDING', 'SUPINE', 'LEFT_LATERAL', 'RIGHT_LATERAL');

-- CreateEnum
CREATE TYPE "VitalConsciousness" AS ENUM ('ALERT', 'VERBAL', 'PAIN', 'UNRESPONSIVE');

-- CreateEnum
CREATE TYPE "GlucoseMeasurementType" AS ENUM ('FASTING', 'RANDOM', 'PRE_PRANDIAL', 'POST_PRANDIAL');

-- CreateEnum
CREATE TYPE "VitalAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "nameAr" TEXT,
    "nameEn" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "clinicId" TEXT,
    "currentClinicId" TEXT,
    "branchId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB,
    "type" TEXT NOT NULL DEFAULT 'string',
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Aden',
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "dateFormat" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "workingHours" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Aden',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "roomType" "RoomType" NOT NULL DEFAULT 'CONSULTATION',
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "roomId" TEXT,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "status" "ResourceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "specifications" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceBooking" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "roomId" TEXT,
    "appointmentId" TEXT,
    "bookedById" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "type" "MaintenanceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "intervalDays" INTEGER,
    "nextDueAt" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentUsageHistory" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "purpose" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentUsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchPriceOverride" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchPriceOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchReport" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "BranchReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "parameters" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "fileUrl" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'GENERATING',

    CONSTRAINT "BranchReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "currentValue" BIGINT NOT NULL DEFAULT 0,
    "padLength" INTEGER NOT NULL DEFAULT 5,
    "suffix" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "departmentId" TEXT,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "basePrice" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "requiresRoom" BOOLEAN NOT NULL DEFAULT false,
    "roomType" "RoomType",
    "requiredResources" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "firstNameAr" TEXT NOT NULL,
    "secondNameAr" TEXT,
    "lastNameAr" TEXT NOT NULL,
    "firstNameEn" TEXT,
    "lastNameEn" TEXT,
    "gender" "Gender" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "nationalId" TEXT,
    "city" "City",
    "address" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bloodType" "BloodType",
    "maritalStatus" "MaritalStatus",
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "insuranceCompany" TEXT,
    "insurancePolicyNumber" TEXT,
    "notes" TEXT,
    "photo" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientView" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMergeRequest" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    "duplicateIds" TEXT[],
    "reason" TEXT NOT NULL,
    "status" "MergeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientMergeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "departmentId" TEXT,
    "roomId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "type" "AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reason" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "doctorId" TEXT,
    "type" "AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
    "status" "EncounterStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "chiefComplaint" TEXT,
    "symptomOnset" TIMESTAMP(3),
    "symptomDurationValue" INTEGER,
    "symptomDurationUnit" TEXT,
    "severity" TEXT,
    "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subjective" TEXT,
    "objective" TEXT,
    "physicalExamination" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "painLocation" TEXT,
    "symptomNature" TEXT,
    "aggravatingFactors" TEXT,
    "alleviatingFactors" TEXT,
    "history" JSONB,
    "examination" JSONB,
    "treatmentPlan" JSONB,
    "temperature" DECIMAL(65,30),
    "pulse" INTEGER,
    "respRate" INTEGER,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "spO2" INTEGER,
    "height" DECIMAL(65,30),
    "weight" DECIMAL(65,30),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitNumber" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "encounterId" TEXT,
    "appointmentId" TEXT,
    "type" "VisitType" NOT NULL DEFAULT 'NEW',
    "priority" "VisitPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "VisitStatus" NOT NULL DEFAULT 'REGISTERED',
    "source" "VisitSource" NOT NULL DEFAULT 'WALK_IN',
    "referralSource" "ReferralSource" NOT NULL DEFAULT 'SELF',
    "reason" TEXT,
    "chiefComplaint" TEXT,
    "symptomDurationValue" INTEGER,
    "symptomDurationUnit" TEXT,
    "arrivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredById" TEXT,
    "doctorId" TEXT,
    "departmentId" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Queue" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "kind" "QueueKind" NOT NULL DEFAULT 'DOCTOR',
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueEntry" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "QueueEntryStatus" NOT NULL DEFAULT 'WAITING',
    "addedById" TEXT,
    "calledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterDiagnosis" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "classification" "DiagnosisClassification" NOT NULL DEFAULT 'ICD10',
    "course" "DiagnosisCourse" NOT NULL DEFAULT 'ACUTE',
    "laterality" "Laterality" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "onsetDate" TIMESTAMP(3),
    "codeSystem" TEXT,
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'PROVISIONAL',
    "confidence" "DiagnosisConfidence",
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isDifferential" BOOLEAN NOT NULL DEFAULT false,
    "parentDiagnosisId" TEXT,
    "diagnosedBy" TEXT,
    "diagnosedAt" TIMESTAMP(3),
    "clinicalFindings" TEXT,
    "supportingLabResultIds" TEXT,
    "supportingImagingIds" TEXT,
    "treatmentPlan" TEXT,
    "followUp" TEXT,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncounterDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalOrder" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "kind" "MedicalOrderKind" NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT,
    "dosage" TEXT,
    "frequency" TEXT,
    "durationDays" INTEGER,
    "quantity" TEXT,
    "unit" TEXT,
    "status" "MedicalOrderStatus" NOT NULL DEFAULT 'PENDING',
    "dispensedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "drugCatalogId" TEXT,
    "genericName" TEXT,
    "brandName" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "route" TEXT,
    "dose" DECIMAL(65,30),
    "doseUnit" TEXT,
    "frequencyCode" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "refills" INTEGER NOT NULL DEFAULT 0,
    "refillsUsed" INTEGER NOT NULL DEFAULT 0,
    "prescriptionStatus" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "dispenseAsWritten" BOOLEAN NOT NULL DEFAULT false,
    "clinicalIndication" TEXT,
    "priority" TEXT,
    "prescribedBy" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "MedicalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "referenceRange" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabRequest" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "orderId" TEXT,
    "patientId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "assignedTo" TEXT,
    "status" "LabRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "testId" TEXT,
    "testName" TEXT NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "resultValue" TEXT,
    "isAbnormal" BOOLEAN,
    "status" "LabResultStatus" NOT NULL DEFAULT 'PENDING',
    "enteredBy" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagingRequest" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "orderId" TEXT,
    "patientId" TEXT NOT NULL,
    "modality" TEXT,
    "status" "ImagingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "findings" TEXT,
    "impression" TEXT,
    "requestedBy" TEXT,
    "reportedBy" TEXT,
    "reportedAt" TIMESTAMP(3),
    "studyInstanceUID" TEXT,
    "seriesInstanceUID" TEXT,
    "sopInstanceUID" TEXT,
    "pacsStatus" TEXT,
    "pacsSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSpecimen" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "labRequestId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "specimenType" "SpecimenType" NOT NULL,
    "containerType" TEXT,
    "volume" TEXT,
    "collectedBy" TEXT,
    "collectedAt" TIMESTAMP(3),
    "labeledBy" TEXT,
    "labeledAt" TIMESTAMP(3),
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "status" "SpecimenStatus" NOT NULL DEFAULT 'ORDERED',
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabSpecimen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabCriticalAlert" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "labResultId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "resultValue" TEXT NOT NULL,
    "referenceRange" TEXT,
    "unit" TEXT,
    "severity" "LabAlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "escalatedTo" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabCriticalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagingReportApproval" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "imagingRequestId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" "ImagingReportStatus" NOT NULL DEFAULT 'DRAFT',
    "findings" TEXT,
    "impression" TEXT,
    "rejectionReason" TEXT,
    "amendmentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagingReportApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispensation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "orderId" TEXT,
    "patientId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "medicationCode" TEXT,
    "quantityDispensed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT,
    "instructions" TEXT,
    "dispensedBy" TEXT,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "currentQty" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "supplier" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(65,30),
    "reference" TEXT,
    "notes" TEXT,
    "movedBy" TEXT,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "invoiceNo" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "kind" "BillingItemKind" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reference" TEXT,
    "receivedBy" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalHistory" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "MedicalHistoryType" NOT NULL DEFAULT 'MEDICAL',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "type" "AllergyType" NOT NULL DEFAULT 'DRUG',
    "reaction" TEXT,
    "severity" "AllergySeverity" NOT NULL DEFAULT 'MILD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notedAt" TIMESTAMP(3),
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "performedAt" TIMESTAMP(3),
    "provider" TEXT,
    "notes" TEXT,
    "status" "ProcedureStatus" NOT NULL DEFAULT 'PLANNED',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDocument" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "category" "PatientDocumentCategory" NOT NULL DEFAULT 'OTHER',
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "notes" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL DEFAULT 'EXTERNAL',
    "toDepartment" TEXT,
    "toFacility" TEXT,
    "toDoctor" TEXT,
    "reason" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "requestedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentForm" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL DEFAULT 'TREATMENT',
    "title" TEXT NOT NULL,
    "version" TEXT,
    "content" TEXT,
    "status" "ConsentStatus" NOT NULL DEFAULT 'DRAFT',
    "signedByName" TEXT,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "departmentId" TEXT,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "contentAr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "requiredFields" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "templateId" TEXT,
    "type" "ConsentType" NOT NULL,
    "version" TEXT NOT NULL,
    "contentAr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "fieldValues" JSONB NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'DRAFT',
    "signedByName" TEXT,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "witnessName" TEXT,
    "witnessId" TEXT,
    "witnessAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokedReason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalSignature" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerRole" TEXT,
    "signatureData" TEXT NOT NULL,
    "signatureType" "SignatureType" NOT NULL DEFAULT 'DRAWN',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,

    CONSTRAINT "DigitalSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCategory" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "retentionDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "patientId" TEXT,
    "encounterId" TEXT,
    "code" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "description" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currentVersionId" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "metadata" JSONB,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "description" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "changesSummary" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisCatalog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "classification" "DiagnosisClassification" NOT NULL DEFAULT 'ICD10',
    "category" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isStandard" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisAmendment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT NOT NULL,
    "amendedBy" TEXT NOT NULL,
    "amendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugCatalog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "genericNameAr" TEXT,
    "brandNames" TEXT,
    "strength" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "atcCode" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "productId" TEXT,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "schedule" TEXT,
    "maxDailyDose" DECIMAL(65,30),
    "maxSingleDose" DECIMAL(65,30),
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "pregnancyCategory" TEXT,
    "renalAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "hepaticAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "contraindications" TEXT,
    "monitoringRequired" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugInteraction" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "drugId1" TEXT NOT NULL,
    "drugId2" TEXT NOT NULL,
    "severity" "InteractionSeverity" NOT NULL,
    "mechanism" TEXT,
    "management" TEXT,
    "evidenceLevel" TEXT,
    "onset" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionAlert" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationReconciliation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,

    CONSTRAINT "MedicationReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "drugCatalogId" TEXT,
    "medicationName" TEXT NOT NULL,
    "dose" TEXT,
    "frequency" TEXT,
    "route" TEXT,
    "source" "ReconciliationSource" NOT NULL,
    "action" "ReconciliationAction" NOT NULL,
    "discrepancyNote" TEXT,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterSignature" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "signedBy" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signatureHash" TEXT NOT NULL,
    "signatureImage" TEXT,

    CONSTRAINT "EncounterSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterAmendment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "amendedBy" TEXT NOT NULL,
    "amendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "previousContent" JSONB NOT NULL,
    "newContent" JSONB NOT NULL,

    CONSTRAINT "EncounterAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "specialty" TEXT,
    "templateType" "TemplateType" NOT NULL DEFAULT 'SOAP',
    "structure" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterTemplateUsage" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncounterTemplateUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "subject" TEXT,
    "subjectAr" TEXT,
    "subjectEn" TEXT,
    "body" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "templateId" TEXT,
    "category" "NotificationCategory" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'USER',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "externalId" TEXT,
    "externalData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDeliveryLog" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "provider" TEXT,
    "status" "NotificationStatus" NOT NULL,
    "providerId" TEXT,
    "providerData" JSONB,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationConsent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT true,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRetryPolicy" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "priority" "NotificationPriority" NOT NULL,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "baseDelayMinutes" INTEGER NOT NULL DEFAULT 5,
    "maxDelayMinutes" INTEGER NOT NULL DEFAULT 1440,
    "backoffMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "jitterPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRetryPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DECIMAL(65,30),
    "pulse" INTEGER,
    "respRate" INTEGER,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "spO2" INTEGER,
    "height" DECIMAL(65,30),
    "weight" DECIMAL(65,30),
    "bmi" DECIMAL(65,30),
    "painScore" INTEGER,
    "consciousness" "VitalConsciousness",
    "glucose" DECIMAL(65,30),
    "glucoseType" "GlucoseMeasurementType",
    "glucoseTiming" TEXT,
    "headCircumference" DECIMAL(65,30),
    "position" "VitalPosition",
    "device" TEXT,
    "notes" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalAlertRule" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "vitalType" "VitalType" NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "sex" TEXT,
    "conditionCode" TEXT,
    "minValue" DECIMAL(65,30),
    "maxValue" DECIMAL(65,30),
    "severity" "VitalAlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalAlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalAlert" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "vitalSignId" TEXT NOT NULL,
    "ruleId" TEXT,
    "vitalType" "VitalType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "severity" "VitalAlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_createdAt_idx" ON "AuditLog"("clinicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_code_key" ON "Clinic"("code");

-- CreateIndex
CREATE INDEX "Branch_clinicId_isActive_idx" ON "Branch"("clinicId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_clinicId_code_key" ON "Branch"("clinicId", "code");

-- CreateIndex
CREATE INDEX "Department_clinicId_branchId_isActive_idx" ON "Department"("clinicId", "branchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Department_clinicId_code_key" ON "Department"("clinicId", "code");

-- CreateIndex
CREATE INDEX "Room_clinicId_branchId_departmentId_isActive_idx" ON "Room"("clinicId", "branchId", "departmentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Room_clinicId_code_key" ON "Room"("clinicId", "code");

-- CreateIndex
CREATE INDEX "Resource_clinicId_branchId_departmentId_roomId_resourceType_idx" ON "Resource"("clinicId", "branchId", "departmentId", "roomId", "resourceType", "status", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_clinicId_code_key" ON "Resource"("clinicId", "code");

-- CreateIndex
CREATE INDEX "ResourceBooking_clinicId_resourceId_startTime_endTime_statu_idx" ON "ResourceBooking"("clinicId", "resourceId", "startTime", "endTime", "status");

-- CreateIndex
CREATE INDEX "ResourceBooking_clinicId_roomId_startTime_endTime_status_idx" ON "ResourceBooking"("clinicId", "roomId", "startTime", "endTime", "status");

-- CreateIndex
CREATE INDEX "ResourceBooking_clinicId_appointmentId_idx" ON "ResourceBooking"("clinicId", "appointmentId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_clinicId_resourceId_scheduledAt_status_idx" ON "MaintenanceSchedule"("clinicId", "resourceId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_clinicId_status_nextDueAt_idx" ON "MaintenanceSchedule"("clinicId", "status", "nextDueAt");

-- CreateIndex
CREATE INDEX "EquipmentUsageHistory_clinicId_resourceId_startTime_idx" ON "EquipmentUsageHistory"("clinicId", "resourceId", "startTime");

-- CreateIndex
CREATE INDEX "EquipmentUsageHistory_clinicId_userId_startTime_idx" ON "EquipmentUsageHistory"("clinicId", "userId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "BranchPriceOverride_branchId_serviceId_key" ON "BranchPriceOverride"("branchId", "serviceId");

-- CreateIndex
CREATE INDEX "BranchReport_clinicId_branchId_type_generatedAt_idx" ON "BranchReport"("clinicId", "branchId", "type", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_clinicId_key_key" ON "NumberSequence"("clinicId", "key");

-- CreateIndex
CREATE INDEX "Service_clinicId_departmentId_category_isActive_idx" ON "Service"("clinicId", "departmentId", "category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Service_clinicId_code_key" ON "Service"("clinicId", "code");

-- CreateIndex
CREATE INDEX "Patient_clinicId_status_idx" ON "Patient"("clinicId", "status");

-- CreateIndex
CREATE INDEX "Patient_clinicId_lastNameAr_idx" ON "Patient"("clinicId", "lastNameAr");

-- CreateIndex
CREATE INDEX "Patient_clinicId_createdAt_idx" ON "Patient"("clinicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Patient_clinicId_phone_idx" ON "Patient"("clinicId", "phone");

-- CreateIndex
CREATE INDEX "Patient_clinicId_city_idx" ON "Patient"("clinicId", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_clinicId_mrn_key" ON "Patient"("clinicId", "mrn");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_clinicId_nationalId_key" ON "Patient"("clinicId", "nationalId");

-- CreateIndex
CREATE INDEX "PatientView_clinicId_viewedAt_idx" ON "PatientView"("clinicId", "viewedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PatientView_userId_patientId_key" ON "PatientView"("userId", "patientId");

-- CreateIndex
CREATE INDEX "PatientMergeRequest_clinicId_status_idx" ON "PatientMergeRequest"("clinicId", "status");

-- CreateIndex
CREATE INDEX "PatientMergeRequest_clinicId_createdAt_idx" ON "PatientMergeRequest"("clinicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Appointment_clinicId_startTime_idx" ON "Appointment"("clinicId", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_clinicId_patientId_startTime_idx" ON "Appointment"("clinicId", "patientId", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_clinicId_status_startTime_idx" ON "Appointment"("clinicId", "status", "startTime");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_startTime_idx" ON "Appointment"("doctorId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Encounter_appointmentId_key" ON "Encounter"("appointmentId");

-- CreateIndex
CREATE INDEX "Encounter_clinicId_patientId_createdAt_idx" ON "Encounter"("clinicId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Encounter_clinicId_status_doctorId_idx" ON "Encounter"("clinicId", "status", "doctorId");

-- CreateIndex
CREATE INDEX "Encounter_doctorId_createdAt_idx" ON "Encounter"("doctorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_encounterId_key" ON "Visit"("encounterId");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_appointmentId_key" ON "Visit"("appointmentId");

-- CreateIndex
CREATE INDEX "Visit_clinicId_status_arrivedAt_idx" ON "Visit"("clinicId", "status", "arrivedAt");

-- CreateIndex
CREATE INDEX "Visit_clinicId_patientId_arrivedAt_idx" ON "Visit"("clinicId", "patientId", "arrivedAt" DESC);

-- CreateIndex
CREATE INDEX "Visit_clinicId_doctorId_priority_arrivedAt_idx" ON "Visit"("clinicId", "doctorId", "priority", "arrivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_clinicId_visitNumber_key" ON "Visit"("clinicId", "visitNumber");

-- CreateIndex
CREATE INDEX "Queue_clinicId_kind_isActive_idx" ON "Queue"("clinicId", "kind", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Queue_clinicId_code_key" ON "Queue"("clinicId", "code");

-- CreateIndex
CREATE INDEX "QueueEntry_clinicId_queueId_status_priority_position_idx" ON "QueueEntry"("clinicId", "queueId", "status", "priority", "position");

-- CreateIndex
CREATE INDEX "QueueEntry_visitId_idx" ON "QueueEntry"("visitId");

-- CreateIndex
CREATE INDEX "QueueEntry_patientId_idx" ON "QueueEntry"("patientId");

-- CreateIndex
CREATE INDEX "EncounterDiagnosis_encounterId_idx" ON "EncounterDiagnosis"("encounterId");

-- CreateIndex
CREATE INDEX "EncounterDiagnosis_clinicId_status_idx" ON "EncounterDiagnosis"("clinicId", "status");

-- CreateIndex
CREATE INDEX "MedicalOrder_clinicId_kind_status_idx" ON "MedicalOrder"("clinicId", "kind", "status");

-- CreateIndex
CREATE INDEX "MedicalOrder_encounterId_idx" ON "MedicalOrder"("encounterId");

-- CreateIndex
CREATE INDEX "MedicalOrder_patientId_idx" ON "MedicalOrder"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_clinicId_code_key" ON "LabTest"("clinicId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "LabRequest_orderId_key" ON "LabRequest"("orderId");

-- CreateIndex
CREATE INDEX "LabRequest_clinicId_status_createdAt_idx" ON "LabRequest"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LabRequest_patientId_idx" ON "LabRequest"("patientId");

-- CreateIndex
CREATE INDEX "LabResult_requestId_idx" ON "LabResult"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "ImagingRequest_orderId_key" ON "ImagingRequest"("orderId");

-- CreateIndex
CREATE INDEX "ImagingRequest_clinicId_status_createdAt_idx" ON "ImagingRequest"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ImagingRequest_patientId_idx" ON "ImagingRequest"("patientId");

-- CreateIndex
CREATE INDEX "LabSpecimen_clinicId_labRequestId_status_idx" ON "LabSpecimen"("clinicId", "labRequestId", "status");

-- CreateIndex
CREATE INDEX "LabSpecimen_patientId_collectedAt_idx" ON "LabSpecimen"("patientId", "collectedAt");

-- CreateIndex
CREATE INDEX "LabCriticalAlert_clinicId_patientId_acknowledged_severity_idx" ON "LabCriticalAlert"("clinicId", "patientId", "acknowledged", "severity");

-- CreateIndex
CREATE INDEX "LabCriticalAlert_labResultId_idx" ON "LabCriticalAlert"("labResultId");

-- CreateIndex
CREATE UNIQUE INDEX "ImagingReportApproval_imagingRequestId_key" ON "ImagingReportApproval"("imagingRequestId");

-- CreateIndex
CREATE INDEX "ImagingReportApproval_clinicId_status_createdAt_idx" ON "ImagingReportApproval"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Dispensation_clinicId_dispensedAt_idx" ON "Dispensation"("clinicId", "dispensedAt");

-- CreateIndex
CREATE INDEX "Dispensation_orderId_idx" ON "Dispensation"("orderId");

-- CreateIndex
CREATE INDEX "InventoryItem_clinicId_currentQty_idx" ON "InventoryItem"("clinicId", "currentQty");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_clinicId_code_key" ON "InventoryItem"("clinicId", "code");

-- CreateIndex
CREATE INDEX "InventoryMovement_clinicId_movedAt_idx" ON "InventoryMovement"("clinicId", "movedAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_itemId_idx" ON "InventoryMovement"("itemId");

-- CreateIndex
CREATE INDEX "Invoice_clinicId_status_createdAt_idx" ON "Invoice"("clinicId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_clinicId_patientId_createdAt_idx" ON "Invoice"("clinicId", "patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_clinicId_invoiceNo_key" ON "Invoice"("clinicId", "invoiceNo");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "MedicalHistory_clinicId_patientId_type_idx" ON "MedicalHistory"("clinicId", "patientId", "type");

-- CreateIndex
CREATE INDEX "MedicalHistory_patientId_idx" ON "MedicalHistory"("patientId");

-- CreateIndex
CREATE INDEX "Allergy_clinicId_patientId_isActive_idx" ON "Allergy"("clinicId", "patientId", "isActive");

-- CreateIndex
CREATE INDEX "Allergy_patientId_idx" ON "Allergy"("patientId");

-- CreateIndex
CREATE INDEX "Procedure_clinicId_patientId_status_idx" ON "Procedure"("clinicId", "patientId", "status");

-- CreateIndex
CREATE INDEX "Procedure_patientId_idx" ON "Procedure"("patientId");

-- CreateIndex
CREATE INDEX "PatientDocument_clinicId_patientId_category_idx" ON "PatientDocument"("clinicId", "patientId", "category");

-- CreateIndex
CREATE INDEX "PatientDocument_patientId_idx" ON "PatientDocument"("patientId");

-- CreateIndex
CREATE INDEX "Referral_clinicId_patientId_status_idx" ON "Referral"("clinicId", "patientId", "status");

-- CreateIndex
CREATE INDEX "Referral_patientId_idx" ON "Referral"("patientId");

-- CreateIndex
CREATE INDEX "ConsentForm_clinicId_patientId_status_idx" ON "ConsentForm"("clinicId", "patientId", "status");

-- CreateIndex
CREATE INDEX "ConsentForm_patientId_idx" ON "ConsentForm"("patientId");

-- CreateIndex
CREATE INDEX "ConsentTemplate_clinicId_type_isActive_idx" ON "ConsentTemplate"("clinicId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentTemplate_clinicId_code_key" ON "ConsentTemplate"("clinicId", "code");

-- CreateIndex
CREATE INDEX "ConsentRecord_clinicId_patientId_type_status_idx" ON "ConsentRecord"("clinicId", "patientId", "type", "status");

-- CreateIndex
CREATE INDEX "ConsentRecord_patientId_status_idx" ON "ConsentRecord"("patientId", "status");

-- CreateIndex
CREATE INDEX "ConsentRecord_templateId_idx" ON "ConsentRecord"("templateId");

-- CreateIndex
CREATE INDEX "DigitalSignature_clinicId_recordId_idx" ON "DigitalSignature"("clinicId", "recordId");

-- CreateIndex
CREATE INDEX "DigitalSignature_signerId_signedAt_idx" ON "DigitalSignature"("signerId", "signedAt");

-- CreateIndex
CREATE INDEX "DocumentCategory_clinicId_parentId_isActive_idx" ON "DocumentCategory"("clinicId", "parentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategory_clinicId_code_key" ON "DocumentCategory"("clinicId", "code");

-- CreateIndex
CREATE INDEX "Document_clinicId_categoryId_status_idx" ON "Document"("clinicId", "categoryId", "status");

-- CreateIndex
CREATE INDEX "Document_clinicId_patientId_status_idx" ON "Document"("clinicId", "patientId", "status");

-- CreateIndex
CREATE INDEX "Document_clinicId_encounterId_status_idx" ON "Document"("clinicId", "encounterId", "status");

-- CreateIndex
CREATE INDEX "Document_code_idx" ON "Document"("code");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_uploadedAt_idx" ON "DocumentVersion"("documentId", "uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "DiagnosisCatalog_clinicId_classification_isActive_idx" ON "DiagnosisCatalog"("clinicId", "classification", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisCatalog_clinicId_code_key" ON "DiagnosisCatalog"("clinicId", "code");

-- CreateIndex
CREATE INDEX "DiagnosisAmendment_diagnosisId_idx" ON "DiagnosisAmendment"("diagnosisId");

-- CreateIndex
CREATE INDEX "DrugCatalog_clinicId_category_isActive_idx" ON "DrugCatalog"("clinicId", "category", "isActive");

-- CreateIndex
CREATE INDEX "DrugCatalog_clinicId_genericName_idx" ON "DrugCatalog"("clinicId", "genericName");

-- CreateIndex
CREATE UNIQUE INDEX "DrugCatalog_clinicId_genericName_strength_dosageForm_key" ON "DrugCatalog"("clinicId", "genericName", "strength", "dosageForm");

-- CreateIndex
CREATE INDEX "DrugInteraction_clinicId_severity_isActive_idx" ON "DrugInteraction"("clinicId", "severity", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DrugInteraction_clinicId_drugId1_drugId2_key" ON "DrugInteraction"("clinicId", "drugId1", "drugId2");

-- CreateIndex
CREATE INDEX "PrescriptionAlert_orderId_idx" ON "PrescriptionAlert"("orderId");

-- CreateIndex
CREATE INDEX "PrescriptionAlert_clinicId_acknowledged_severity_idx" ON "PrescriptionAlert"("clinicId", "acknowledged", "severity");

-- CreateIndex
CREATE INDEX "MedicationReconciliation_clinicId_patientId_performedAt_idx" ON "MedicationReconciliation"("clinicId", "patientId", "performedAt");

-- CreateIndex
CREATE INDEX "ReconciliationItem_reconciliationId_idx" ON "ReconciliationItem"("reconciliationId");

-- CreateIndex
CREATE UNIQUE INDEX "EncounterSignature_encounterId_key" ON "EncounterSignature"("encounterId");

-- CreateIndex
CREATE INDEX "EncounterSignature_clinicId_signedAt_idx" ON "EncounterSignature"("clinicId", "signedAt");

-- CreateIndex
CREATE INDEX "EncounterAmendment_encounterId_idx" ON "EncounterAmendment"("encounterId");

-- CreateIndex
CREATE INDEX "ClinicalTemplate_clinicId_departmentId_specialty_isActive_idx" ON "ClinicalTemplate"("clinicId", "departmentId", "specialty", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTemplate_clinicId_name_key" ON "ClinicalTemplate"("clinicId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EncounterTemplateUsage_encounterId_key" ON "EncounterTemplateUsage"("encounterId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_clinicId_category_isActive_idx" ON "NotificationTemplate"("clinicId", "category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_clinicId_category_channel_key" ON "NotificationTemplate"("clinicId", "category", "channel");

-- CreateIndex
CREATE INDEX "Notification_clinicId_recipientId_status_createdAt_idx" ON "Notification"("clinicId", "recipientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_clinicId_category_status_idx" ON "Notification"("clinicId", "category", "status");

-- CreateIndex
CREATE INDEX "Notification_scheduledAt_status_idx" ON "Notification"("scheduledAt", "status");

-- CreateIndex
CREATE INDEX "NotificationDeliveryLog_notificationId_createdAt_idx" ON "NotificationDeliveryLog"("notificationId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDeliveryLog_providerId_idx" ON "NotificationDeliveryLog"("providerId");

-- CreateIndex
CREATE INDEX "NotificationPreference_clinicId_userId_idx" ON "NotificationPreference"("clinicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_clinicId_userId_category_channel_key" ON "NotificationPreference"("clinicId", "userId", "category", "channel");

-- CreateIndex
CREATE INDEX "NotificationConsent_clinicId_userId_idx" ON "NotificationConsent"("clinicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationConsent_clinicId_userId_channel_key" ON "NotificationConsent"("clinicId", "userId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRetryPolicy_clinicId_channel_priority_key" ON "NotificationRetryPolicy"("clinicId", "channel", "priority");

-- CreateIndex
CREATE INDEX "VitalSign_clinicId_patientId_recordedAt_idx" ON "VitalSign"("clinicId", "patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "VitalSign_encounterId_idx" ON "VitalSign"("encounterId");

-- CreateIndex
CREATE INDEX "VitalAlertRule_clinicId_vitalType_isActive_idx" ON "VitalAlertRule"("clinicId", "vitalType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VitalAlertRule_clinicId_vitalType_ageMin_ageMax_sex_conditi_key" ON "VitalAlertRule"("clinicId", "vitalType", "ageMin", "ageMax", "sex", "conditionCode");

-- CreateIndex
CREATE INDEX "VitalAlert_clinicId_patientId_acknowledged_severity_idx" ON "VitalAlert"("clinicId", "patientId", "acknowledged", "severity");

-- CreateIndex
CREATE INDEX "VitalAlert_vitalSignId_idx" ON "VitalAlert"("vitalSignId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBooking" ADD CONSTRAINT "ResourceBooking_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBooking" ADD CONSTRAINT "ResourceBooking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBooking" ADD CONSTRAINT "ResourceBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBooking" ADD CONSTRAINT "ResourceBooking_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceBooking" ADD CONSTRAINT "ResourceBooking_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUsageHistory" ADD CONSTRAINT "EquipmentUsageHistory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUsageHistory" ADD CONSTRAINT "EquipmentUsageHistory_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUsageHistory" ADD CONSTRAINT "EquipmentUsageHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentUsageHistory" ADD CONSTRAINT "EquipmentUsageHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPriceOverride" ADD CONSTRAINT "BranchPriceOverride_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPriceOverride" ADD CONSTRAINT "BranchPriceOverride_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchPriceOverride" ADD CONSTRAINT "BranchPriceOverride_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchReport" ADD CONSTRAINT "BranchReport_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchReport" ADD CONSTRAINT "BranchReport_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumberSequence" ADD CONSTRAINT "NumberSequence_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientView" ADD CONSTRAINT "PatientView_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientView" ADD CONSTRAINT "PatientView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientView" ADD CONSTRAINT "PatientView_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMergeRequest" ADD CONSTRAINT "PatientMergeRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMergeRequest" ADD CONSTRAINT "PatientMergeRequest_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterDiagnosis" ADD CONSTRAINT "EncounterDiagnosis_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalOrder" ADD CONSTRAINT "MedicalOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRequest" ADD CONSTRAINT "LabRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MedicalOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "LabRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "LabTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingRequest" ADD CONSTRAINT "ImagingRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MedicalOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSpecimen" ADD CONSTRAINT "LabSpecimen_labRequestId_fkey" FOREIGN KEY ("labRequestId") REFERENCES "LabRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabCriticalAlert" ADD CONSTRAINT "LabCriticalAlert_labResultId_fkey" FOREIGN KEY ("labResultId") REFERENCES "LabResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingReportApproval" ADD CONSTRAINT "ImagingReportApproval_imagingRequestId_fkey" FOREIGN KEY ("imagingRequestId") REFERENCES "ImagingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispensation" ADD CONSTRAINT "Dispensation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MedicalOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentTemplate" ADD CONSTRAINT "ConsentTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentTemplate" ADD CONSTRAINT "ConsentTemplate_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalSignature" ADD CONSTRAINT "DigitalSignature_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalSignature" ADD CONSTRAINT "DigitalSignature_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ConsentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalSignature" ADD CONSTRAINT "DigitalSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCategory" ADD CONSTRAINT "DocumentCategory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCategory" ADD CONSTRAINT "DocumentCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DocumentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisAmendment" ADD CONSTRAINT "DiagnosisAmendment_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "EncounterDiagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_drugId1_fkey" FOREIGN KEY ("drugId1") REFERENCES "DrugCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_drugId2_fkey" FOREIGN KEY ("drugId2") REFERENCES "DrugCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionAlert" ADD CONSTRAINT "PrescriptionAlert_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MedicalOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "MedicationReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterSignature" ADD CONSTRAINT "EncounterSignature_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterAmendment" ADD CONSTRAINT "EncounterAmendment_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterTemplateUsage" ADD CONSTRAINT "EncounterTemplateUsage_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterTemplateUsage" ADD CONSTRAINT "EncounterTemplateUsage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClinicalTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDeliveryLog" ADD CONSTRAINT "NotificationDeliveryLog_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_id_fkey" FOREIGN KEY ("id") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalAlert" ADD CONSTRAINT "VitalAlert_vitalSignId_fkey" FOREIGN KEY ("vitalSignId") REFERENCES "VitalSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
