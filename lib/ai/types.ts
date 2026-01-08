/**
 * AI Provider Types
 * 
 * Unified types for multi-provider AI support (OpenAI, Google, Anthropic)
 */

export type AIProviderName = "openai" | "google" | "anthropic";

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  name: AIProviderName;
  
  /**
   * Extract entities from email content
   */
  extractEntities(email: ParsedEmailInput): Promise<ExtractedData>;
  
  /**
   * General purpose completion for flexible prompts
   */
  complete(prompt: string, systemPrompt?: string): Promise<string>;
}

// Input types (what we send to extraction)
export interface ParsedEmailInput {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  subject: string;
  body: {
    text: string;
    html?: string;
  };
  date: string;
}

export interface EmailAddress {
  name?: string;
  email: string;
}

// Output types (what extraction returns)
export interface ExtractedData {
  emailId: string;
  extractedAt: string;
  provider: AIProviderName;
  confidence: number;
  
  purchaser: PurchaserIdentity | null;
  projectSignals: ProjectSignals | null;
  bidDueDates: BidDueDate[];
  extractionNotes: string[];
}

export interface PurchaserIdentity {
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  confidence: number;
}

export interface ProjectSignals {
  projectName?: string;
  projectAddress?: string;
  generalContractor?: string;
  engineer?: string;
  architect?: string;
  confidence: number;
}

export interface BidDueDate {
  date: string;
  time?: string;
  timezone?: string;
  source: "explicit" | "inferred";
  rawText: string;
  confidence: number;
}

// Model configurations (updated January 2026)
export const DEFAULT_MODELS: Record<AIProviderName, string> = {
  openai: "gpt-5.2",
  google: "gemini-3-pro-preview",
  anthropic: "claude-sonnet-4-5-20250929",
};

export const DEFAULT_CONFIG: Omit<AIProviderConfig, "apiKey" | "provider"> = {
  model: "",
  temperature: 0.1,
  maxTokens: 4096,
};
