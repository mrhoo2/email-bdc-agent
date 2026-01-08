/**
 * Seller Inference Service
 * 
 * MVP approach: Infer seller from email recipients by looking for @buildvision.io addresses.
 * Future: Will integrate with Postgres for mapping purchasers to assigned sellers.
 */

import type { EmailAddress, Seller, InferredSeller } from "./types";

// ============================================
// Configuration
// ============================================

const BUILDVISION_DOMAIN = "buildvision.io";

// ============================================
// Main Inference Function
// ============================================

/**
 * Infer the assigned seller from email recipients
 * 
 * Strategy:
 * 1. Check TO recipients for @buildvision.io addresses
 * 2. Check CC recipients for @buildvision.io addresses
 * 3. Return null if no BuildVision seller found
 */
export function inferSellerFromEmail(params: {
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc?: EmailAddress[];
}): InferredSeller {
  const { to, cc, bcc = [] } = params;
  
  // Check TO recipients first (highest confidence)
  const toSeller = findBuildVisionSeller(to);
  if (toSeller) {
    return {
      seller: toSeller,
      source: "email_recipient",
      confidence: 0.95,
      reasoning: `Found BuildVision seller in TO field: ${toSeller.email}`,
    };
  }
  
  // Check CC recipients (slightly lower confidence)
  const ccSeller = findBuildVisionSeller(cc);
  if (ccSeller) {
    return {
      seller: ccSeller,
      source: "email_recipient",
      confidence: 0.85,
      reasoning: `Found BuildVision seller in CC field: ${ccSeller.email}`,
    };
  }
  
  // Check BCC recipients (lowest confidence for recipient-based)
  const bccSeller = findBuildVisionSeller(bcc);
  if (bccSeller) {
    return {
      seller: bccSeller,
      source: "email_recipient",
      confidence: 0.75,
      reasoning: `Found BuildVision seller in BCC field: ${bccSeller.email}`,
    };
  }
  
  // No BuildVision seller found
  return {
    seller: null,
    source: "email_recipient",
    confidence: 0,
    reasoning: "No @buildvision.io email address found in recipients",
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Find a BuildVision seller from a list of email addresses
 */
function findBuildVisionSeller(addresses: EmailAddress[]): Seller | null {
  for (const addr of addresses) {
    if (isBuildVisionEmail(addr.email)) {
      return createSellerFromEmail(addr);
    }
  }
  return null;
}

/**
 * Check if an email address belongs to BuildVision
 */
function isBuildVisionEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  return domain === BUILDVISION_DOMAIN;
}

/**
 * Create a Seller object from an email address
 * 
 * Name inference rules:
 * 1. Use display name if provided
 * 2. Otherwise, infer from email username (e.g., "john.doe" → "John Doe")
 */
function createSellerFromEmail(addr: EmailAddress): Seller {
  const name = addr.name || inferNameFromEmail(addr.email);
  
  return {
    id: generateSellerId(addr.email),
    name,
    email: addr.email.toLowerCase(),
    territory: undefined, // Will be populated from Postgres in future
  };
}

/**
 * Infer a human-readable name from an email address
 * 
 * Examples:
 * - "john.doe@buildvision.io" → "John Doe"
 * - "jdoe@buildvision.io" → "Jdoe"
 * - "bids@buildvision.io" → "Bids" (generic mailbox)
 */
function inferNameFromEmail(email: string): string {
  const username = email.split("@")[0];
  
  // Handle common separators
  const parts = username
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean);
  
  // Capitalize each part
  return parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Generate a stable ID from an email address
 */
function generateSellerId(email: string): string {
  // Use a simple hash for MVP
  // In production, this would be the actual user ID from Postgres
  const normalizedEmail = email.toLowerCase().trim();
  return `seller_${normalizedEmail.replace(/[^a-z0-9]/g, "_")}`;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get all BuildVision sellers from a list of email addresses
 * Useful for emails sent to multiple BuildVision recipients
 */
export function findAllBuildVisionSellers(addresses: EmailAddress[]): Seller[] {
  return addresses
    .filter(addr => isBuildVisionEmail(addr.email))
    .map(createSellerFromEmail);
}

/**
 * Check if any BuildVision seller is in the recipients
 */
export function hasBuildVisionRecipient(params: {
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc?: EmailAddress[];
}): boolean {
  const allAddresses = [...params.to, ...params.cc, ...(params.bcc || [])];
  return allAddresses.some(addr => isBuildVisionEmail(addr.email));
}
