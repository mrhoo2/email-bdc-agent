/**
 * Zod Validation Schemas for Entity Extraction
 * 
 * These schemas validate the output from Gemini 3 Pro extraction
 * to ensure type safety and data integrity.
 */

import { z } from "zod";

// ============================================
// Base Schemas
// ============================================

export const EmailAddressSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
});

export const ConfidenceSchema = z.number().min(0).max(1);

// ============================================
// Extraction Output Schemas
// ============================================

export const PurchaserIdentitySchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  confidence: ConfidenceSchema,
});

export const ProjectSignalsSchema = z.object({
  projectName: z.string().nullable().optional(),
  projectAddress: z.string().nullable().optional(),
  generalContractor: z.string().nullable().optional(),
  engineer: z.string().nullable().optional(),
  architect: z.string().nullable().optional(),
  confidence: ConfidenceSchema,
});

export const BidDueDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  source: z.enum(["explicit", "inferred"]),
  rawText: z.string(),
  confidence: ConfidenceSchema,
});

export const ExtractedDataSchema = z.object({
  emailId: z.string(),
  extractedAt: z.string().datetime(),
  provider: z.enum(["openai", "google", "anthropic"]),
  confidence: ConfidenceSchema,
  purchaser: PurchaserIdentitySchema.nullable(),
  projectSignals: ProjectSignalsSchema.nullable(),
  bidDueDates: z.array(BidDueDateSchema),
  extractionNotes: z.array(z.string()),
});

// ============================================
// API Request/Response Schemas
// ============================================

export const ExtractionRequestSchema = z.object({
  emailId: z.string().min(1, "Email ID is required"),
  // Optional: can include email data directly instead of fetching
  emailData: z.object({
    from: EmailAddressSchema,
    to: z.array(EmailAddressSchema),
    cc: z.array(EmailAddressSchema),
    subject: z.string(),
    body: z.object({
      text: z.string(),
      html: z.string().optional(),
    }),
    date: z.string(),
    threadId: z.string(),
  }).optional(),
});

export const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: ExtractedDataSchema.optional(),
  error: z.string().optional(),
});

export const BatchExtractionRequestSchema = z.object({
  emailIds: z.array(z.string()).min(1).max(10),
});

export const BatchExtractionResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(
    z.object({
      emailId: z.string(),
      success: z.boolean(),
      data: ExtractedDataSchema.optional(),
      error: z.string().optional(),
    })
  ),
  summary: z.object({
    total: z.number(),
    succeeded: z.number(),
    failed: z.number(),
  }),
});

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type PurchaserIdentity = z.infer<typeof PurchaserIdentitySchema>;
export type ProjectSignals = z.infer<typeof ProjectSignalsSchema>;
export type BidDueDate = z.infer<typeof BidDueDateSchema>;
export type ExtractedData = z.infer<typeof ExtractedDataSchema>;
export type ExtractionRequest = z.infer<typeof ExtractionRequestSchema>;
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;
export type BatchExtractionRequest = z.infer<typeof BatchExtractionRequestSchema>;
export type BatchExtractionResponse = z.infer<typeof BatchExtractionResponseSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate extraction output from AI provider
 * Returns the validated data or throws a ZodError
 */
export function validateExtractedData(data: unknown): ExtractedData {
  return ExtractedDataSchema.parse(data);
}

/**
 * Safe validation that returns a result object instead of throwing
 */
export function safeValidateExtractedData(data: unknown): {
  success: boolean;
  data?: ExtractedData;
  errors?: z.ZodError;
} {
  const result = ExtractedDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate and coerce partial extraction data
 * Useful for handling incomplete AI responses
 */
export function coerceExtractedData(data: unknown, emailId: string, provider: "openai" | "google" | "anthropic"): ExtractedData {
  const partial = data as Record<string, unknown>;
  
  return ExtractedDataSchema.parse({
    emailId,
    extractedAt: new Date().toISOString(),
    provider,
    confidence: typeof partial.confidence === "number" ? partial.confidence : 0,
    purchaser: partial.purchaser ?? null,
    projectSignals: partial.projectSignals ?? null,
    bidDueDates: Array.isArray(partial.bidDueDates) ? partial.bidDueDates : [],
    extractionNotes: Array.isArray(partial.extractionNotes) ? partial.extractionNotes : [],
  });
}
