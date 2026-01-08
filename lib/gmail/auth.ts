/**
 * Gmail OAuth Authentication Service
 * Handles OAuth 2.0 flow for Gmail API access
 */

import { google } from "googleapis";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import type { GmailTokens, GmailAuthState, GmailProfile } from "./types";

// OAuth2 scopes - read-only access to Gmail
const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// Token storage file path (for development - production would use secure storage)
const TOKEN_FILE = join(process.cwd(), ".gmail-tokens.json");

// In-memory cache
let storedTokens: GmailTokens | null = null;

/**
 * Load tokens from file (development persistence)
 */
function loadTokensFromFile(): GmailTokens | null {
  try {
    if (existsSync(TOKEN_FILE)) {
      const data = readFileSync(TOKEN_FILE, "utf-8");
      return JSON.parse(data) as GmailTokens;
    }
  } catch (error) {
    console.error("Failed to load tokens from file:", error);
  }
  return null;
}

/**
 * Save tokens to file (development persistence)
 */
function saveTokensToFile(tokens: GmailTokens | null): void {
  try {
    if (tokens) {
      writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    } else if (existsSync(TOKEN_FILE)) {
      unlinkSync(TOKEN_FILE);
    }
  } catch (error) {
    console.error("Failed to save tokens to file:", error);
  }
}

/**
 * Get OAuth2 client configuration
 */
function getOAuth2Config() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Gmail OAuth not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env.local"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Create a new OAuth2 client instance
 */
export function createOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getOAuth2Config();

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate the OAuth authorization URL
 */
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // Request refresh token
    scope: GMAIL_SCOPES,
    prompt: "consent", // Force consent screen to get refresh token
  });

  return url;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GmailTokens> {
  const oauth2Client = createOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Failed to get access token from Google");
  }

  const gmailTokens: GmailTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
    token_type: tokens.token_type ?? "Bearer",
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
  };

  // Store tokens (in memory and file)
  storeTokens(gmailTokens);

  return gmailTokens;
}

/**
 * Store tokens (persisted to file in development)
 */
export function storeTokens(tokens: GmailTokens): void {
  storedTokens = tokens;
  saveTokensToFile(tokens);
}

/**
 * Get stored tokens (loads from file if not in memory)
 */
export function getStoredTokens(): GmailTokens | null {
  if (!storedTokens) {
    storedTokens = loadTokensFromFile();
  }
  return storedTokens;
}

/**
 * Clear stored tokens (logout)
 */
export function clearTokens(): void {
  storedTokens = null;
  saveTokensToFile(null);
}

/**
 * Check if tokens are expired
 */
export function areTokensExpired(tokens: GmailTokens): boolean {
  // Add 5 minute buffer before expiry
  const bufferMs = 5 * 60 * 1000;
  return Date.now() >= tokens.expiry_date - bufferMs;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  tokens: GmailTokens
): Promise<GmailTokens> {
  if (!tokens.refresh_token) {
    throw new Error("No refresh token available. Re-authentication required.");
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  const refreshedTokens: GmailTokens = {
    access_token: credentials.access_token ?? tokens.access_token,
    refresh_token: credentials.refresh_token ?? tokens.refresh_token,
    scope: credentials.scope ?? tokens.scope,
    token_type: credentials.token_type ?? tokens.token_type,
    expiry_date: credentials.expiry_date ?? Date.now() + 3600 * 1000,
  };

  // Update stored tokens (in memory and file)
  storeTokens(refreshedTokens);

  return refreshedTokens;
}

/**
 * Get valid tokens (refresh if needed)
 */
export async function getValidTokens(): Promise<GmailTokens | null> {
  const tokens = getStoredTokens();

  if (!tokens) {
    return null;
  }

  if (areTokensExpired(tokens)) {
    try {
      return await refreshAccessToken(tokens);
    } catch {
      // Refresh failed, need to re-authenticate
      clearTokens();
      return null;
    }
  }

  return tokens;
}

/**
 * Get authenticated OAuth2 client
 */
export async function getAuthenticatedClient() {
  const tokens = await getValidTokens();

  if (!tokens) {
    throw new Error("Not authenticated. Please connect your Gmail account.");
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  return oauth2Client;
}

/**
 * Get Gmail profile for authenticated user
 */
export async function getGmailProfile(): Promise<GmailProfile> {
  const oauth2Client = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const response = await gmail.users.getProfile({
    userId: "me",
  });

  return {
    emailAddress: response.data.emailAddress ?? "",
    messagesTotal: response.data.messagesTotal ?? 0,
    threadsTotal: response.data.threadsTotal ?? 0,
    historyId: response.data.historyId ?? "",
  };
}

/**
 * Get current auth state
 */
export async function getAuthState(): Promise<GmailAuthState> {
  const tokens = getStoredTokens();

  if (!tokens) {
    return { isAuthenticated: false };
  }

  try {
    const profile = await getGmailProfile();
    return {
      isAuthenticated: true,
      email: profile.emailAddress,
      expiresAt: tokens.expiry_date,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}
