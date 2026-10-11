import type { NotificationChannel, NotificationCategory, NotificationPriority, NotificationStatus, NotificationTemplate, Notification, NotificationPreference, NotificationConsent, NotificationRetryPolicy } from "@/lib/generated/prisma/client";

/** Normalized notification data for sending */
export interface NotificationPayload {
  clinicId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  recipientId: string;
  recipientType?: "USER" | "PATIENT" | "STAFF" | "EXTERNAL";
  priority?: NotificationPriority;
  subject?: string;
  body: string;
  data?: Record<string, unknown>;
  templateId?: string;
  scheduledAt?: Date;
  maxRetries?: number;
}

/** Result of a send attempt */
export interface SendResult {
  success: boolean;
  externalId?: string;
  externalData?: Record<string, unknown>;
  error?: string;
}

/** Channel adapter interface */
export interface NotificationChannelAdapter {
  readonly channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<SendResult>;
  supportsPriority?: boolean;
}

/** Template rendering context */
export interface TemplateContext {
  [key: string]: string | number | Date | boolean | null | undefined;
}

/** Recipient info for channel delivery */
export interface RecipientInfo {
  userId: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  locale: "ar" | "en";
  preferences?: NotificationPreference[];
  consent?: NotificationConsent[];
}

/** Channel configuration */
export interface ChannelConfig {
  sms?: {
    provider: "twilio" | "plivo" | "vonage" | "custom";
    from?: string;
    accountSid?: string;
    authToken?: string;
  };
  email?: {
    provider: "smtp" | "sendgrid" | "mailgun" | "resend" | "custom";
    from: string;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    apiKey?: string;
  };
  whatsapp?: {
    provider: "twilio" | "360dialog" | "gupshup" | "custom";
    phoneNumberId?: string;
    accessToken?: string;
  };
}

/** Notification system configuration */
export interface NotificationSystemConfig {
  defaultMaxRetries: number;
  defaultBaseDelayMinutes: number;
  defaultMaxDelayMinutes: number;
  defaultBackoffMultiplier: number;
  defaultJitterPercent: number;
  quietHoursDefaultStart: string; // "22:00"
  quietHoursDefaultEnd: string;   // "08:00"
  channels: ChannelConfig;
}