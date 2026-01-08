/**
 * Gmail API Types
 * Defines types for Gmail API interactions
 */

// ============================================
// Raw Gmail API Response Types
// ============================================

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string; // Unix timestamp in ms
  payload?: GmailMessagePart;
  sizeEstimate?: number;
  raw?: string; // Base64 encoded full message (when format=raw)
}

export interface GmailMessagePart {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePartBody {
  attachmentId?: string;
  size: number;
  data?: string; // Base64 URL encoded
}

export interface GmailMessageList {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailThread {
  id: string;
  historyId?: string;
  messages?: GmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: 'show' | 'hide';
  labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  type?: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

// ============================================
// Parsed/Processed Types
// ============================================

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: {
    text: string;
    html?: string;
  };
  date: Date;
  receivedAt: Date;
  labels: string[];
  snippet: string;
  attachments: Attachment[];
}

// ============================================
// OAuth Types
// ============================================

export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface GmailAuthState {
  isAuthenticated: boolean;
  email?: string;
  expiresAt?: number;
  error?: string;
}

// ============================================
// Service Types
// ============================================

export interface FetchEmailsOptions {
  maxResults?: number;
  pageToken?: string;
  query?: string; // Gmail search query
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

export interface FetchEmailsResult {
  emails: ParsedEmail[];
  nextPageToken?: string;
  totalEstimate?: number;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}
