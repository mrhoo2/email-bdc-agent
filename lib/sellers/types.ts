/**
 * Seller Types
 * 
 * Type definitions for seller inference and mapping.
 */

import { z } from "zod";

// ============================================
// Zod Schemas
// ============================================

export const SellerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  territory: z.string().optional(),
});

export const InferredSellerSchema = z.object({
  seller: SellerSchema.nullable(),
  source: z.enum(["email_recipient", "postgres_mapping", "inferred"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

// ============================================
// Type Exports
// ============================================

export type Seller = z.infer<typeof SellerSchema>;
export type InferredSeller = z.infer<typeof InferredSellerSchema>;

// ============================================
// Email Address Type (for inference input)
// ============================================

export interface EmailAddress {
  name?: string;
  email: string;
}
