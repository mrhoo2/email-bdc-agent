/**
 * Entity Extraction Service
 * 
 * Uses Gemini 3 Pro to extract structured data from bid emails.
 * This is the main entry point for extraction functionality.
 */

import { createAIProvider } from "@/lib/ai";
import type { ParsedEmail } from "@/lib/gmail/types";
import type { ParsedEmailInput, ExtractedData as AIExtractedData } from "@/lib/ai/types";
import { inferSellerFromEmail } from "@/lib/sellers";
import {
  safeValidateExtractedData,
  type ExtractedData,
  type ExtractionResponse,
} from "./schemas";

export * from "./schemas";

// ============================================
// Service Configuration
// ============================================

interface ExtractionServiceConfig {
  apiKey?: string;
}

// ============================================
// Main Extraction Function
// ============================================

/**
 * Extract entities from a parsed email using Gemini 3 Pro
 */
export async function extractEntitiesFromEmail(
  email: ParsedEmail,
  config?: ExtractionServiceConfig
): Promise<ExtractionResponse> {
  try {
    // Get API key from config or environment
    const apiKey = config?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "Google Generative AI API key not configured",
      };
    }

    // Create Gemini 3 Pro Preview provider
    const provider = createAIProvider({
      provider: "google",
      apiKey,
      model: "gemini-3-pro-preview",
    });

    // Convert ParsedEmail to ParsedEmailInput format
    const emailInput: ParsedEmailInput = {
      id: email.id,
      threadId: email.threadId,
      from: email.from,
      to: email.to,
      cc: email.cc,
      subject: email.subject,
      body: email.body,
      date: email.date.toISOString(),
    };

    // Call Gemini 3 Pro for extraction
    const result = await provider.extractEntities(emailInput);

    // Infer seller from email recipients (no AI needed)
    const inferredSeller = inferSellerFromEmail({
      to: email.to,
      cc: email.cc,
    });

    // Validate the result with Zod
    const validation = safeValidateExtractedData({
      ...result,
      inferredSeller,
    });

    if (validation.success && validation.data) {
      return {
        success: true,
        data: validation.data,
      };
    }

    // If validation fails, try to extract what we can
    console.warn("Extraction validation failed:", validation.errors?.issues);
    
    // Return the raw result with a warning note
    return {
      success: true,
      data: {
        ...result,
        inferredSeller,
        extractionNotes: [
          ...(result.extractionNotes || []),
          "Warning: Some fields failed validation",
        ],
      } as ExtractedData,
    };
  } catch (error) {
    console.error("Extraction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown extraction error",
    };
  }
}

/**
 * Extract entities from raw email data (without fetching from Gmail)
 */
export async function extractEntitiesFromRaw(
  emailData: {
    id: string;
    threadId: string;
    from: { name?: string; email: string };
    to: { name?: string; email: string }[];
    cc: { name?: string; email: string }[];
    subject: string;
    body: { text: string; html?: string };
    date: string;
  },
  config?: ExtractionServiceConfig
): Promise<ExtractionResponse> {
  try {
    const apiKey = config?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "Google Generative AI API key not configured",
      };
    }

    const provider = createAIProvider({
      provider: "google",
      apiKey,
      model: "gemini-3-pro-preview",
    });

    const result = await provider.extractEntities(emailData);

    // Infer seller from email recipients (no AI needed)
    const inferredSeller = inferSellerFromEmail({
      to: emailData.to,
      cc: emailData.cc,
    });

    const validation = safeValidateExtractedData({
      ...result,
      inferredSeller,
    });

    if (validation.success && validation.data) {
      return {
        success: true,
        data: validation.data,
      };
    }

    return {
      success: true,
      data: {
        ...result,
        inferredSeller,
        extractionNotes: [
          ...(result.extractionNotes || []),
          "Warning: Some fields failed validation",
        ],
      } as ExtractedData,
    };
  } catch (error) {
    console.error("Extraction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown extraction error",
    };
  }
}

// ============================================
// Batch Extraction
// ============================================

export interface BatchExtractionResult {
  emailId: string;
  success: boolean;
  data?: ExtractedData;
  error?: string;
}

/**
 * Extract entities from multiple emails
 * Processes in sequence to respect rate limits
 */
export async function extractEntitiesFromEmails(
  emails: ParsedEmail[],
  config?: ExtractionServiceConfig
): Promise<{
  results: BatchExtractionResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}> {
  const results: BatchExtractionResult[] = [];

  for (const email of emails) {
    const response = await extractEntitiesFromEmail(email, config);
    
    results.push({
      emailId: email.id,
      success: response.success,
      data: response.data,
      error: response.error,
    });

    // Small delay between requests to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return {
    results,
    summary: {
      total: emails.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if extraction found any meaningful data
 */
export function hasExtractionData(data: ExtractedData): boolean {
  return (
    data.purchaser !== null ||
    data.projectSignals !== null ||
    data.bidDueDates.length > 0
  );
}

/**
 * Get a summary of what was extracted
 */
export function getExtractionSummary(data: ExtractedData): string {
  const parts: string[] = [];

  if (data.purchaser) {
    parts.push(`Purchaser: ${data.purchaser.companyName}`);
  }
  if (data.projectSignals?.projectName) {
    parts.push(`Project: ${data.projectSignals.projectName}`);
  }
  if (data.bidDueDates.length > 0) {
    parts.push(`${data.bidDueDates.length} bid date(s)`);
  }

  if (parts.length === 0) {
    return "No entities extracted";
  }

  return parts.join(" • ");
}

/**
 * Format confidence as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(
  confidence: number
): "high" | "medium" | "low" {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}
