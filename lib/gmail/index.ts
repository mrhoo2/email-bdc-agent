/**
 * Gmail Service
 * Main service for fetching and parsing emails from Gmail API
 */

import { google } from "googleapis";
import { getAuthenticatedClient } from "./auth";
import type {
  GmailMessage,
  GmailMessagePart,
  GmailHeader,
  ParsedEmail,
  EmailAddress,
  Attachment,
  FetchEmailsOptions,
  FetchEmailsResult,
  GmailLabel,
} from "./types";

// Re-export auth functions and types
export * from "./auth";
export * from "./types";

/**
 * Get Gmail API client
 */
async function getGmailClient() {
  const auth = await getAuthenticatedClient();
  return google.gmail({ version: "v1", auth });
}

/**
 * Fetch emails from Gmail
 */
export async function fetchEmails(
  options: FetchEmailsOptions = {}
): Promise<FetchEmailsResult> {
  const gmail = await getGmailClient();

  const {
    maxResults = 50,
    pageToken,
    query,
    labelIds,
    includeSpamTrash = false,
  } = options;

  // List message IDs
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    pageToken,
    q: query,
    labelIds,
    includeSpamTrash,
  });

  const messageIds = listResponse.data.messages ?? [];
  const nextPageToken = listResponse.data.nextPageToken ?? undefined;
  const totalEstimate = listResponse.data.resultSizeEstimate ?? 0;

  // Fetch full message details in parallel (with rate limiting consideration)
  const emails: ParsedEmail[] = [];

  // Batch fetch messages (Gmail API allows batch requests)
  const batchSize = 10;
  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async ({ id }) => {
      try {
        const messageResponse = await gmail.users.messages.get({
          userId: "me",
          id: id!,
          format: "full",
        });
        return parseGmailMessage(messageResponse.data as GmailMessage);
      } catch (error) {
        console.error(`Failed to fetch message ${id}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    emails.push(...batchResults.filter((e): e is ParsedEmail => e !== null));
  }

  return {
    emails,
    nextPageToken,
    totalEstimate,
  };
}

/**
 * Fetch a single email by ID
 */
export async function fetchEmailById(
  messageId: string
): Promise<ParsedEmail | null> {
  const gmail = await getGmailClient();

  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    return parseGmailMessage(response.data as GmailMessage);
  } catch (error) {
    console.error(`Failed to fetch message ${messageId}:`, error);
    return null;
  }
}

/**
 * Fetch all emails from a thread
 */
export async function fetchThread(threadId: string): Promise<ParsedEmail[]> {
  const gmail = await getGmailClient();

  const response = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = response.data.messages ?? [];
  return messages.map((msg) => parseGmailMessage(msg as GmailMessage));
}

/**
 * Get all labels from Gmail
 */
export async function getLabels(): Promise<GmailLabel[]> {
  const gmail = await getGmailClient();

  const response = await gmail.users.labels.list({
    userId: "me",
  });

  return (response.data.labels ?? []) as GmailLabel[];
}

/**
 * Fetch all emails (pagination helper for backfill)
 */
export async function fetchAllEmails(
  options: Omit<FetchEmailsOptions, "pageToken"> & { maxTotal?: number } = {}
): Promise<ParsedEmail[]> {
  const { maxTotal = 1000, ...fetchOptions } = options;
  const allEmails: ParsedEmail[] = [];
  let pageToken: string | undefined;

  do {
    const result = await fetchEmails({
      ...fetchOptions,
      pageToken,
      maxResults: Math.min(fetchOptions.maxResults ?? 50, maxTotal - allEmails.length),
    });

    allEmails.push(...result.emails);
    pageToken = result.nextPageToken;

    // Progress logging for large fetches
    if (allEmails.length % 100 === 0) {
      console.log(`Fetched ${allEmails.length} emails...`);
    }
  } while (pageToken && allEmails.length < maxTotal);

  return allEmails;
}

// ============================================
// Email Parsing Utilities
// ============================================

/**
 * Parse a raw Gmail message into our structured format
 */
export function parseGmailMessage(message: GmailMessage): ParsedEmail {
  const headers = message.payload?.headers ?? [];
  const parts = message.payload?.parts;
  const body = message.payload?.body;
  const mimeType = message.payload?.mimeType ?? "text/plain";

  // Extract headers
  const from = parseEmailAddress(getHeader(headers, "From") ?? "");
  const to = parseEmailAddressList(getHeader(headers, "To") ?? "");
  const cc = parseEmailAddressList(getHeader(headers, "Cc") ?? "");
  const bcc = parseEmailAddressList(getHeader(headers, "Bcc") ?? "");
  const subject = getHeader(headers, "Subject") ?? "(no subject)";
  const dateStr = getHeader(headers, "Date") ?? "";

  // Parse body content
  const bodyContent = extractBody(message.payload, mimeType);

  // Extract attachments
  const attachments = extractAttachments(parts);

  // Parse date
  const date = dateStr ? new Date(dateStr) : new Date(parseInt(message.internalDate ?? "0", 10));
  const receivedAt = new Date(parseInt(message.internalDate ?? "0", 10));

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    to,
    cc,
    bcc,
    subject,
    body: bodyContent,
    date,
    receivedAt,
    labels: message.labelIds ?? [],
    snippet: message.snippet ?? "",
    attachments,
  };
}

/**
 * Get a specific header value
 */
function getHeader(headers: GmailHeader[], name: string): string | undefined {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value;
}

/**
 * Parse a single email address from "Name <email@domain.com>" format
 */
function parseEmailAddress(addressString: string): EmailAddress {
  const cleaned = addressString.trim();

  // Handle "Name <email@domain.com>" format
  const match = cleaned.match(/^(?:"?([^"<]+)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?$/);

  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2].toLowerCase(),
    };
  }

  // Fallback: assume the whole string is an email
  return {
    email: cleaned.toLowerCase() || "unknown@unknown.com",
  };
}

/**
 * Parse a comma-separated list of email addresses
 */
function parseEmailAddressList(addressString: string): EmailAddress[] {
  if (!addressString.trim()) return [];

  // Split by comma, but not commas inside quotes
  const addresses: string[] = [];
  let current = "";
  let inQuotes = false;
  let depth = 0;

  for (const char of addressString) {
    if (char === '"') inQuotes = !inQuotes;
    if (char === "<") depth++;
    if (char === ">") depth--;

    if (char === "," && !inQuotes && depth === 0) {
      if (current.trim()) addresses.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) addresses.push(current.trim());

  return addresses.map(parseEmailAddress);
}

/**
 * Extract body content from message payload
 */
function extractBody(
  payload: GmailMessagePart | undefined,
  mimeType: string
): { text: string; html?: string } {
  if (!payload) {
    return { text: "" };
  }

  // Simple body (no parts)
  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (mimeType === "text/html") {
      return { text: stripHtml(decoded), html: decoded };
    }
    return { text: decoded };
  }

  // Multipart message
  if (payload.parts) {
    return extractBodyFromParts(payload.parts);
  }

  return { text: "" };
}

/**
 * Extract body from multipart message parts
 */
function extractBodyFromParts(parts: GmailMessagePart[]): {
  text: string;
  html?: string;
} {
  let text = "";
  let html: string | undefined;

  for (const part of parts) {
    const partMimeType = part.mimeType;

    // Check for nested multipart
    if (part.parts) {
      const nested = extractBodyFromParts(part.parts);
      if (!text && nested.text) text = nested.text;
      if (!html && nested.html) html = nested.html;
      continue;
    }

    // Extract content from this part
    if (part.body?.data) {
      const decoded = decodeBase64Url(part.body.data);

      if (partMimeType === "text/plain" && !text) {
        text = decoded;
      } else if (partMimeType === "text/html" && !html) {
        html = decoded;
        if (!text) {
          text = stripHtml(decoded);
        }
      }
    }
  }

  return { text, html };
}

/**
 * Extract attachment metadata from message parts
 */
function extractAttachments(parts?: GmailMessagePart[]): Attachment[] {
  if (!parts) return [];

  const attachments: Attachment[] = [];

  for (const part of parts) {
    // Check for nested parts
    if (part.parts) {
      attachments.push(...extractAttachments(part.parts));
      continue;
    }

    // Check if this part is an attachment
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
        attachmentId: part.body.attachmentId,
      });
    }
  }

  return attachments;
}

/**
 * Decode base64url encoded string
 */
function decodeBase64Url(encoded: string): string {
  // Convert base64url to base64
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  while (base64.length % 4) {
    base64 += "=";
  }

  // Decode
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * Strip HTML tags to get plain text
 */
function stripHtml(html: string): string {
  return html
    // Remove script and style tags with content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Replace common block elements with newlines
    .replace(/<\/(p|div|h[1-6]|li|tr|br|hr)>/gi, "\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    // Remove remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}
