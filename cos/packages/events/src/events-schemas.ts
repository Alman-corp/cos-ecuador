import { z } from "zod";

export const DocumentUploadedSchema = z.object({
  eventType: z.literal("document.uploaded"),
  tenantId: z.string().uuid(),
  documentId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number().positive(),
  uploadedBy: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export const RiskThresholdBreachedSchema = z.object({
  eventType: z.literal("risk.critical"),
  tenantId: z.string().uuid(),
  clientId: z.string().uuid(),
  metric: z.string(),
  value: z.number(),
  threshold: z.number(),
  previousValue: z.number().optional(),
  timestamp: z.string().datetime(),
});

export const ClientStageChangedSchema = z.object({
  eventType: z.literal("client.stage_changed"),
  tenantId: z.string().uuid(),
  clientId: z.string().uuid(),
  previousStage: z.string(),
  newStage: z.string(),
  changedBy: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export const MeetingScheduledSchema = z.object({
  eventType: z.literal("meeting.scheduled"),
  tenantId: z.string().uuid(),
  meetingId: z.string().uuid(),
  clientId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export const CosEventSchema = z.discriminatedUnion("eventType", [
  DocumentUploadedSchema,
  RiskThresholdBreachedSchema,
  ClientStageChangedSchema,
  MeetingScheduledSchema,
]);

export type CosEvent = z.infer<typeof CosEventSchema>;
export type DocumentUploaded = z.infer<typeof DocumentUploadedSchema>;
export type RiskThresholdBreached = z.infer<typeof RiskThresholdBreachedSchema>;
export type ClientStageChanged = z.infer<typeof ClientStageChangedSchema>;
export type MeetingScheduled = z.infer<typeof MeetingScheduledSchema>;
