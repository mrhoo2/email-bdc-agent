/**
 * AI Provider Factory
 * 
 * Creates AI providers based on configuration.
 * Supports runtime switching between OpenAI, Google (Gemini), and Anthropic (Claude).
 */

import type { AIProvider, AIProviderConfig, AIProviderName } from "./types";
import { DEFAULT_MODELS, FAST_MODELS } from "./types";
import { createOpenAIProvider } from "./providers/openai";
import { createGoogleProvider } from "./providers/google";
import { createAnthropicProvider } from "./providers/anthropic";

export * from "./types";
export * from "./prompts";

/**
 * Create an AI provider instance based on configuration
 */
export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      return createOpenAIProvider({
        ...config,
        model: config.model || DEFAULT_MODELS.openai,
      });
    case "google":
      return createGoogleProvider({
        ...config,
        model: config.model || DEFAULT_MODELS.google,
      });
    case "anthropic":
      return createAnthropicProvider({
        ...config,
        model: config.model || DEFAULT_MODELS.anthropic,
      });
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

/**
 * Create an AI provider from environment variables
 * Uses the pro-tier model for high-quality results
 */
export function createAIProviderFromEnv(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "google") as AIProviderName;

  let apiKey: string | undefined;

  switch (provider) {
    case "openai":
      apiKey = process.env.OPENAI_API_KEY;
      break;
    case "google":
      apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      break;
    case "anthropic":
      apiKey = process.env.ANTHROPIC_API_KEY;
      break;
  }

  if (!apiKey) {
    throw new Error(
      `API key not found for provider: ${provider}. ` +
      `Set the appropriate environment variable (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or ANTHROPIC_API_KEY).`
    );
  }

  return createAIProvider({
    provider,
    apiKey,
    model: DEFAULT_MODELS[provider],
  });
}

/**
 * Create a fast AI provider from environment variables
 * Uses the fast-tier model (Flash/Mini/Sonnet) for speed-optimized tasks
 */
export function createFastAIProviderFromEnv(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "google") as AIProviderName;

  let apiKey: string | undefined;

  switch (provider) {
    case "openai":
      apiKey = process.env.OPENAI_API_KEY;
      break;
    case "google":
      apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      break;
    case "anthropic":
      apiKey = process.env.ANTHROPIC_API_KEY;
      break;
  }

  if (!apiKey) {
    throw new Error(
      `API key not found for provider: ${provider}. ` +
      `Set the appropriate environment variable (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or ANTHROPIC_API_KEY).`
    );
  }

  return createAIProvider({
    provider,
    apiKey,
    model: FAST_MODELS[provider],
  });
}

/**
 * Get available providers based on environment variables
 */
export function getAvailableProviders(): AIProviderName[] {
  const available: AIProviderName[] = [];

  if (process.env.OPENAI_API_KEY) {
    available.push("openai");
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    available.push("google");
  }
  if (process.env.ANTHROPIC_API_KEY) {
    available.push("anthropic");
  }

  return available;
}

/**
 * Create all available providers (for comparison testing)
 */
export function createAllAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (process.env.OPENAI_API_KEY) {
    providers.push(
      createAIProvider({
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        model: DEFAULT_MODELS.openai,
      })
    );
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    providers.push(
      createAIProvider({
        provider: "google",
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        model: DEFAULT_MODELS.google,
      })
    );
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push(
      createAIProvider({
        provider: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: DEFAULT_MODELS.anthropic,
      })
    );
  }

  return providers;
}
