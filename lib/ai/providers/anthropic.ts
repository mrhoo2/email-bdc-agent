/**
 * Anthropic Claude Provider Implementation
 * Updated January 2026 for Claude 4.5 Sonnet
 * NOTE: Claude 4.5 Sonnet extraction deferred to future iteration - focusing on Gemini 3 first
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  AIProviderConfig,
  ParsedEmailInput,
  ExtractedData,
} from "../types";
import {
  EXTRACTION_SYSTEM_PROMPT,
  createExtractionPrompt,
} from "../prompts";

export function createAnthropicProvider(config: AIProviderConfig): AIProvider {
  const client = new Anthropic({
    apiKey: config.apiKey,
  });

  // Default to Claude 4.5 Sonnet (January 2026)
  const model = config.model || "claude-4.5-sonnet";
  const temperature = config.temperature ?? 0.1;
  const maxTokens = config.maxTokens ?? 4096;

  return {
    name: "anthropic",

    async extractEntities(email: ParsedEmailInput): Promise<ExtractedData> {
      const prompt = createExtractionPrompt({
        from: email.from,
        to: email.to,
        cc: email.cc,
        subject: email.subject,
        body: email.body,
        date: email.date,
      });

      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      // Extract text content from response
      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("Anthropic returned no text content");
      }

      const content = textContent.text;

      // Clean potential markdown code blocks
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleanedContent);

      return {
        emailId: email.id,
        extractedAt: new Date().toISOString(),
        provider: "anthropic",
        confidence: calculateOverallConfidence(parsed),
        purchaser: parsed.purchaser || null,
        projectSignals: parsed.projectSignals || null,
        bidDueDates: parsed.bidDueDates || [],
        extractionNotes: parsed.extractionNotes || [],
      };
    },

    async complete(prompt: string, systemPrompt?: string): Promise<string> {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        ...(systemPrompt && { system: systemPrompt }),
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        return "";
      }

      return textContent.text;
    },
  };
}

function calculateOverallConfidence(parsed: {
  purchaser?: { confidence?: number } | null;
  projectSignals?: { confidence?: number } | null;
  bidDueDates?: Array<{ confidence?: number }>;
}): number {
  const scores: number[] = [];

  if (parsed.purchaser?.confidence) {
    scores.push(parsed.purchaser.confidence);
  }
  if (parsed.projectSignals?.confidence) {
    scores.push(parsed.projectSignals.confidence);
  }
  if (parsed.bidDueDates) {
    for (const date of parsed.bidDueDates) {
      if (date.confidence) {
        scores.push(date.confidence);
      }
    }
  }

  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
