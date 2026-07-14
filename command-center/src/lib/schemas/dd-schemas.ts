import { z } from "zod"

export const CreateEngagementSchema = z.object({
  companyName: z.string().min(2).max(200),
  industry: z.string().min(2).max(100),
  fiscalYear: z.number().int().min(2000).max(2030),
  currency: z.enum(["USD", "EUR", "COP", "MXN"]),
  description: z.string().max(2000).optional(),
  scope: z.array(z.enum(["financial", "legal", "tax", "operational", "commercial"])).min(1),
})

export const UpdateEngagementSchema = z.object({
  id: z.string().uuid(),
  companyName: z.string().min(2).max(200).optional(),
  status: z.enum(["draft", "in_progress", "review", "completed", "archived"]).optional(),
})

export const SubmitReportSchema = z.object({
  engagementId: z.string().uuid(),
  sections: z.array(z.string()).min(1),
  notes: z.string().max(3000).optional(),
})

export const EngagementIdSchema = z.object({
  id: z.string().uuid(),
})

export type CreateEngagementInput = z.infer<typeof CreateEngagementSchema>
export type UpdateEngagementInput = z.infer<typeof UpdateEngagementSchema>
export type SubmitReportInput = z.infer<typeof SubmitReportSchema>
