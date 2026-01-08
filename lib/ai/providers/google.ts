/**
 * Google Gemini Provider Implementation
 * Updated January 2026 for Gemini 3 Pro
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
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

export function createGoogleProvider(config: AIProviderConfig): AIProvider {
  const client = new GoogleGenerativeAI(config.apiKey);

  // Default to Gemini 3 Pro Preview (January 2026)
  const modelName = config.model || "gemini-3-pro-preview";
  const temperature = config.temperature ?? 0.1;
  const maxTokens = config.maxTokens ?? 4096;

  return {
    name: "google",

    async extractEntities(email: ParsedEmailInput): Promise<ExtractedData> {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      });

      const prompt = createExtractionPrompt({
        from: email.from,
        to: email.to,
        cc: email.cc,
        subject: email.subject,
        body: email.body,
        date: email.date,
      });

      const fullPrompt = `${EXTRACTION_SYSTEM_PROMPT}\n\n${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const content = response.text();

      if (!content) {
        throw new Error("Gemini returned empty response");
      }

      // Clean potential markdown code blocks
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleanedContent);

      return {
        emailId: email.id,
        extractedAt: new Date().toISOString(),
        provider: "google",
        confidence: calculateOverallConfidence(parsed),
        purchaser: parsed.purchaser || null,
        projectSignals: parsed.projectSignals || null,
        bidDueDates: parsed.bidDueDates || [],
        extractionNotes: parsed.extractionNotes || [],
      };
    },

    async complete(prompt: string, systemPrompt?: string): Promise<string> {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });

      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      return response.text() || "";
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
