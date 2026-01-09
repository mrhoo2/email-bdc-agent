/**
 * Bid List Types
 * 
 * Types for the bid list UI and date-based grouping.
 * Updated for GreenHack demo to support multiple bidders per project.
 */

import type { ProjectCluster } from "@/lib/clustering/types";
import type { ExtractedData } from "@/lib/extraction/schemas";
import type { ParsedEmail } from "@/lib/gmail/types";

// ============================================
// Date Group Types
// ============================================

export type DateGroup = 
  | "overdue"
  | "today"
  | "tomorrow"
  | "this_week"
  | "next_week"
  | "later"
  | "no_date";

export const DateGroupLabels: Record<DateGroup, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  this_week: "This Week",
  next_week: "Next Week",
  later: "Later",
  no_date: "No Due Date",
};

export const DateGroupPriority: Record<DateGroup, number> = {
  overdue: 0,
  today: 1,
  tomorrow: 2,
  this_week: 3,
  next_week: 4,
  later: 5,
  no_date: 6,
};

// ============================================
// Purchaser Type (mechanical/electrical subcontractor)
// ============================================

/**
 * Represents an individual purchaser (mechanical/electrical subcontractor) requesting a quote.
 * 
 * Business Context:
 * - Purchasers are contractors who need equipment pricing from BuildVision
 * - Multiple purchasers may request quotes for the same project
 * - Each purchaser has their own due date for when they need the quote
 * - Purchasers receive bid requests from GCs and pass requirements to sales reps
 */
export interface Purchaser {
  /** Company name of the purchaser (e.g., "Bay Mechanical", "ABC Mechanical") */
  companyName: string;
  /** Contact person name at the purchaser company */
  contactName?: string;
  /** Contact email */
  contactEmail?: string;
  /** Contact phone */
  contactPhone?: string;
  /** Due date when this purchaser needs the quote */
  dueDate?: Date;
  /** Due time */
  dueTime?: string;
  /** Source email ID where this purchaser was identified */
  emailId: string;
  /** Where the purchaser info was extracted from */
  source: PurchaserSource;
  /** Date group for this purchaser's due date */
  dateGroup: DateGroup;
}

/**
 * Source of purchaser information extraction.
 * Internal sales reps may forward emails - purchaser info is often in the body, not the "from" header.
 */
export type PurchaserSource = 
  | "signature"      // Extracted from email signature in body
  | "forwarded"      // Extracted from forwarded message content
  | "header"         // From email "From" header
  | "body"           // From email body content
  | "inferred";      // AI-inferred from context

// ============================================
// Bid Item Type (Project-centric)
// ============================================

/**
 * Represents a project with potentially multiple purchasers requesting quotes.
 * This is the primary display unit in the bid list.
 * 
 * Business Context:
 * - A project is a construction job (e.g., "Downtown Medical Center")
 * - Multiple mechanical subcontractors (purchasers) may request quotes for the same project
 * - Each purchaser may have a different due date
 * - BuildVision sales rep manages all quote requests for a project
 */
export interface BidItem {
  id: string;
  
  // Project info (from cluster or extraction)
  projectName: string | null;
  projectAddress: string | null;
  generalContractor?: string | null;
  engineer?: string | null;
  architect?: string | null;
  
  // Multiple purchasers requesting quotes for this project
  purchasers: Purchaser[];
  
  // Seller info (BuildVision rep - from inference)
  sellerName: string | null;
  sellerEmail: string | null;
  
  // Earliest due date across all bidders (for sorting/grouping)
  earliestDueDate: Date | null;
  earliestDueTime: string | null;
  
  // Source data
  emailIds: string[];
  emails: ParsedEmail[];
  extractions: ExtractedData[];
  cluster: ProjectCluster | null;
  
  // Group assignment (based on earliest due date)
  dateGroup: DateGroup;
  
  // Status (for future use)
  status: "pending" | "submitted" | "won" | "lost" | "no_bid";
  
  // Legacy fields for backwards compatibility
  /** @deprecated Use bidders[0].companyName instead */
  purchaserCompany: string | null;
  /** @deprecated Use bidders[0].contactName instead */
  purchaserContact: string | null;
  /** @deprecated Use bidders[0].contactEmail instead */
  purchaserEmail: string | null;
  /** @deprecated Use bidders[0].contactPhone instead */
  purchaserPhone: string | null;
  /** @deprecated Use earliestDueDate instead */
  bidDueDate: Date | null;
  /** @deprecated Use earliestDueTime instead */
  bidDueTime: string | null;
  /** @deprecated Use extractions instead */
  extraction: ExtractedData | null;
}

// ============================================
// Grouped Bid List
// ============================================

export interface BidGroup {
  group: DateGroup;
  label: string;
  bids: BidItem[];
  count: number;
}

export interface GroupedBidList {
  groups: BidGroup[];
  summary: BidListSummary;
  generatedAt: Date;
}

export interface BidListSummary {
  totalBids: number;
  totalEmails: number;
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
}

// ============================================
// Processing State
// ============================================

export interface ProcessingState {
  stage: "idle" | "connecting" | "fetching" | "extracting" | "clustering" | "complete" | "error";
  progress: number; // 0-100
  message: string;
  emailsFetched: number;
  emailsExtracted: number;
  bidsCreated: number;
  error?: string;
}

export const INITIAL_PROCESSING_STATE: ProcessingState = {
  stage: "idle",
  progress: 0,
  message: "Ready to process",
  emailsFetched: 0,
  emailsExtracted: 0,
  bidsCreated: 0,
};
