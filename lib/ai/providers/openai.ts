/**
 * OpenAI Provider Implementation
 * Updated January 2026 for GPT-5.2
 * NOTE: GPT-5.2 extraction deferred to future iteration - focusing on Gemini 3 first
 */

import OpenAI from "openai";
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

export function createOpenAIProvider(config: AIProviderConfig): AIProvider {
  const client = new OpenAI({
    apiKey: config.apiKey,
  });

  // Default to GPT-5.2 (January 2026)
  const model = config.model || "gpt-5.2";
  const temperature = config.temperature ?? 0.1;
  const maxTokens = config.maxTokens ?? 4096;

  return {
    name: "openai",

    async extractEntities(email: ParsedEmailInput): Promise<ExtractedData> {
      const prompt = createExtractionPrompt({
        from: email.from,
        to: email.to,
        cc: email.cc,
        subject: email.subject,
        body: email.body,
        date: email.date,
      });

      const response = await client.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned empty response");
      }

      const parsed = JSON.parse(content);

      return {
        emailId: email.id,
        extractedAt: new Date().toISOString(),
        provider: "openai",
        confidence: calculateOverallConfidence(parsed),
        purchaser: parsed.purchaser || null,
        projectSignals: parsed.projectSignals || null,
        bidDueDates: parsed.bidDueDates || [],
        extractionNotes: parsed.extractionNotes || [],
      };
    },

    async complete(prompt: string, systemPrompt?: string): Promise<string> {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await client.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages,
      });

      return response.choices[0]?.message?.content || "";
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
