import type { NotificationTemplate, NotificationChannel } from "@/lib/generated/prisma/client";
import type { TemplateContext } from "./types";

/** Simple template variable pattern: {{variableName}} */
const VARIABLE_REGEX = /\{\{\s*(\w+)\s*\}\}/g;

/** Render a template with the given context */
export function renderTemplate(
  template: string,
  context: TemplateContext,
  fallback: string = ""
): string {
  if (!template) return fallback;

  return template.replace(VARIABLE_REGEX, (match, key) => {
    const value = context[key];
    if (value === undefined || value === null) return match;
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return String(value);
  });
}

/** Get localized content from template */
export function getLocalizedContent<T extends { bodyAr: string; bodyEn: string }>(
  template: T,
  locale: "ar" | "en",
  context: TemplateContext
): string {
  const source = locale === "ar" ? template.bodyAr : template.bodyEn;
  return renderTemplate(source, context);
}

/** Get localized subject from template */
export function getLocalizedSubject<T extends { subjectAr?: string | null; subjectEn?: string | null }>(
  template: T,
  locale: "ar" | "en",
  context: TemplateContext
): string | undefined {
  const source = locale === "ar" ? template.subjectAr : template.subjectEn;
  if (!source) return undefined;
  return renderTemplate(source, context);
}

/** Extract variable names from a template string */
export function extractVariables(template: string): string[] {
  if (!template) return [];
  const matches = template.match(/\{\{\s*(\w+)\s*\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.replace(/\{\{\s*(\w+)\s*\}\}/, "$1")))];
}

/** Validate that all required variables are present in context */
export function validateTemplateContext(
  template: string,
  context: TemplateContext,
  requiredOnly: boolean = true
): { valid: boolean; missing: string[] } {
  const variables = extractVariables(template);
  const missing = variables.filter(v => context[v] === undefined || context[v] === null);
  return {
    valid: missing.length === 0,
    missing: requiredOnly ? missing : [],
  };
}

/** Get channel-specific template content */
export function getChannelContent(
  template: {
    bodyAr: string;
    bodyEn: string;
    subjectAr?: string | null;
    subjectEn?: string | null;
  },
  locale: "ar" | "en",
  context: TemplateContext
): { subject?: string; body: string } {
  return {
    subject: getLocalizedSubject(
      { subjectAr: template.subjectAr, subjectEn: template.subjectEn },
      locale,
      context
    ),
    body: getLocalizedContent(
      { bodyAr: template.bodyAr, bodyEn: template.bodyEn },
      locale,
      context
    ),
  };
}

/** Default notification templates for system categories */
export const SYSTEM_TEMPLATES = {
  APPOINTMENT_CONFIRMATION: {
    ar: {
      subject: "طھط£ظƒظٹط¯ ظ…ظˆط¹ط¯ظƒ ظپظٹ {{clinicName}}",
      body: `ط¹ط²ظٹط²ظٹ {{patientName}}طŒ\n\nطھظ… طھط£ظƒظٹط¯ ظ…ظˆط¹ط¯ظƒ ظپظٹ {{clinicName}}:\nط§ظ„طھط§ط±ظٹط®: {{appointmentDate}}\nط§ظ„ظˆظ‚طھ: {{appointmentTime}}\nط§ظ„ط·ط¨ظٹط¨: {{doctorName}}\nط§ظ„ظ‚ط³ظ…: {{departmentName}}\n\nظ†ظ†طھط¸ط± ط²ظٹط§ط±طھظƒ.\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Appointment Confirmation at {{clinicName}}",
      body: `Dear {{patientName}},\n\nYour appointment at {{clinicName}} has been confirmed:\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\nDoctor: {{doctorName}}\nDepartment: {{departmentName}}\n\nWe look forward to seeing you.\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  APPOINTMENT_REMINDER: {
    ar: {
      subject: "طھط°ظƒظٹط±: ظ…ظˆط¹ط¯ظƒ ط؛ط¯ط§ظ‹ ظپظٹ {{clinicName}}",
      body: `ط¹ط²ظٹط²ظٹ {{patientName}}طŒ\n\nطھط°ظƒظٹط± ط¨ظ…ظˆط¹ط¯ظƒ ط؛ط¯ط§ظ‹ ظپظٹ {{clinicName}}:\nط§ظ„طھط§ط±ظٹط®: {{appointmentDate}}\nط§ظ„ظˆظ‚طھ: {{appointmentTime}}\nط§ظ„ط·ط¨ظٹط¨: {{doctorName}}\n\nظٹط±ط¬ظ‰ ط§ظ„ط­ط¶ظˆط± ظ‚ط¨ظ„ 15 ط¯ظ‚ظٹظ‚ط©.\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Reminder: Your appointment tomorrow at {{clinicName}}",
      body: `Dear {{patientName}},\n\nReminder: Your appointment tomorrow at {{clinicName}}:\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\nDoctor: {{doctorName}}\n\nPlease arrive 15 minutes early.\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  APPOINTMENT_CHANGE: {
    ar: {
      subject: "طھط؛ظٹظٹط± ظپظٹ ظ…ظˆط¹ط¯ظƒ ظپظٹ {{clinicName}}",
      body: `ط¹ط²ظٹط²ظٹ {{patientName}}طŒ\n\nطھظ… طھط؛ظٹظٹط± ظ…ظˆط¹ط¯ظƒ ظپظٹ {{clinicName}}:\nط§ظ„ظ…ظˆط¹ط¯ ط§ظ„ط¬ط¯ظٹط¯: {{newDate}} ظپظٹ {{newTime}}\nط§ظ„ط·ط¨ظٹط¨: {{doctorName}}\nط§ظ„ط³ط¨ط¨: {{changeReason}}\n\nظٹط±ط¬ظ‰ طھط£ظƒظٹط¯ ط§ظ„ط­ط¶ظˆط± ط£ظˆ ط§ظ„طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ظ„ط¥ط¹ط§ط¯ط© ط§ظ„ط¬ط¯ظˆظ„ط©.\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Change to your appointment at {{clinicName}}",
      body: `Dear {{patientName}},\n\nYour appointment at {{clinicName}} has been changed:\nNew date: {{newDate}} at {{newTime}}\nDoctor: {{doctorName}}\nReason: {{changeReason}}\n\nPlease confirm attendance or contact us to reschedule.\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  LAB_RESULT: {
    ar: {
      subject: "ظ†طھظٹط¬ط© ط§ظ„ظپط­طµ ط§ظ„ظ…ط®ط¨ط±ظٹ ظ…طھط§ط­ط© - {{clinicName}}",
      body: `ط¹ط²ظٹط²ظٹ {{patientName}}طŒ\n\nظ†طھظٹط¬ط© ط§ظ„ظپط­طµ ط§ظ„ظ…ط®ط¨ط±ظٹ ({{testName}}) ط£طµط¨ط­طھ ظ…طھط§ط­ط©.\nظٹظ…ظƒظ†ظƒ ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظ†طھظٹط¬ط© ط¹ط¨ط± ط§ظ„ط¨ظˆط§ط¨ط© ط£ظˆ ط§ظ„ط­ط¶ظˆط± ظ„ظ„ط¹ظٹط§ط¯ط©.\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Lab result available - {{clinicName}}",
      body: `Dear {{patientName}},\n\nYour lab result ({{testName}}) is now available.\nYou can view the result via the portal or visit the clinic.\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  PRESCRIPTION_READY: {
    ar: {
      subject: "ظˆطµظپطھظƒ ط§ظ„ط·ط¨ظٹط© ط¬ط§ظ‡ط²ط© ظ„ظ„ط§ط³طھظ„ط§ظ… - {{clinicName}}",
      body: `ط¹ط²ظٹط²ظٹ {{patientName}}طŒ\n\nظˆطµظپطھظƒ ط§ظ„ط·ط¨ظٹط© ({{prescriptionNumber}}) ط¬ط§ظ‡ط²ط© ظ„ظ„ط§ط³طھظ„ط§ظ… ظ…ظ† ط§ظ„طµظٹط¯ظ„ظٹط©.\nط§ظ„ط±ط¬ط§ط، ط§ظ„ط­ط¶ظˆط± ط®ظ„ط§ظ„ ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„.\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Prescription ready for pickup - {{clinicName}}",
      body: `Dear {{patientName}},\n\nYour prescription ({{prescriptionNumber}}) is ready for pickup at the pharmacy.\nPlease visit during business hours.\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  PAYMENT_RECEIPT: {
    ar: {
      subject: "ط¥ظٹطµط§ظ„ ط¯ظپط¹ - {{clinicName}}",
      body: `ط¹ط²ظٹط²ظٹ {{patientName}}طŒ\n\nط´ظƒط±ط§ظ‹ ظ„ط¯ظپط¹ظƒ ظ…ط¨ظ„ط؛ {{amount}} {{currency}}.\nط±ظ‚ظ… ط§ظ„ط¥ظٹطµط§ظ„: {{receiptNumber}}\nط§ظ„طھط§ط±ظٹط®: {{paymentDate}}\nط§ظ„ظˆطµظپ: {{description}}\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Payment receipt - {{clinicName}}",
      body: `Dear {{patientName}},\n\nThank you for your payment of {{amount}} {{currency}}.\nReceipt number: {{receiptNumber}}\nDate: {{paymentDate}}\nDescription: {{description}}\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  BALANCE_REMINDER: {
    ar: {
      subject: "طھط°ظƒظٹط± ط¨ط§ظ„ط±طµظٹط¯ ط§ظ„ظ…ط³طھط­ظ‚ - {{clinicName}}",
      body: `ط¹ط²ظٹط²ظٹ {{patientName}}طŒ\n\nظ„ط¯ظٹظƒ ط±طµظٹط¯ ظ…ط³طھط­ظ‚ ظ‚ط¯ط±ظ‡ {{amount}} {{currency}}.\nط§ظ„ط±ط¬ط§ط، طھط³ظˆظٹط© ط§ظ„ط­ط³ط§ط¨ ظپظٹ ط£ظ‚ط±ط¨ ظˆظ‚طھ.\nظ„ظ„ط§ط³طھظپط³ط§ط±طŒ طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ط¹ظ„ظ‰ {{clinicPhone}}.\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Outstanding balance reminder - {{clinicName}}",
      body: `Dear {{patientName}},\n\nYou have an outstanding balance of {{amount}} {{currency}}.\nPlease settle the account at your earliest convenience.\nFor inquiries, contact us at {{clinicPhone}}.\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  CLINIC_ANNOUNCEMENT: {
    ar: {
      subject: "ط¥ط¹ظ„ط§ظ† ظ…ظ† {{clinicName}}",
      body: `{{announcementBody}}\n\nظ…ط¹ ط§ظ„طھط­ظٹط©طŒ\nظپط±ظٹظ‚ {{clinicName}}`,
    },
    en: {
      subject: "Announcement from {{clinicName}}",
      body: `{{announcementBody}}\n\nBest regards,\n{{clinicName}} Team`,
    },
  },
  STAFF_TASK: {
    ar: {
      subject: "ظ…ظ‡ظ…ط© ط¬ط¯ظٹط¯ط©: {{taskTitle}}",
      body: `ظ„ط¯ظٹظƒ ظ…ظ‡ظ…ط© ط¬ط¯ظٹط¯ط©:\n{{taskDescription}}\nط§ظ„ط£ظˆظ„ظˆظٹط©: {{priority}}\nطھط§ط±ظٹط® ط§ظ„ط§ط³طھط­ظ‚ط§ظ‚: {{dueDate}}\n\nظٹط±ط¬ظ‰ ظ…ط±ط§ط¬ط¹ط© ط§ظ„طھظپط§طµظٹظ„ ظˆط§طھط®ط§ط° ط§ظ„ط¥ط¬ط±ط§ط، ط§ظ„ظ„ط§ط²ظ….`,
    },
    en: {
      subject: "New task: {{taskTitle}}",
      body: `You have a new task:\n{{taskDescription}}\nPriority: {{priority}}\nDue date: {{dueDate}}\n\nPlease review and take necessary action.`,
    },
  },
} as const;

/** Create a system template if it doesn't exist */
export function getSystemTemplate(category: string): typeof SYSTEM_TEMPLATES[keyof typeof SYSTEM_TEMPLATES] | undefined {
  return SYSTEM_TEMPLATES[category as keyof typeof SYSTEM_TEMPLATES];
}