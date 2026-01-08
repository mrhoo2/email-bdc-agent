/**
 * Bid List Types
 * 
 * Types for the bid list UI and date-based grouping.
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
// Bid Item Type
// ============================================

export interface BidItem {
  id: string;
  // Project info (from cluster or extraction)
  projectName: string | null;
  projectAddress: string | null;
  // Purchaser info (from extraction)
  purchaserCompany: string | null;
  purchaserContact: string | null;
  purchaserEmail: string | null;
  purchaserPhone: string | null;
  // Seller info (from inference)
  sellerName: string | null;
  sellerEmail: string | null;
  // Due date
  bidDueDate: Date | null;
  bidDueTime: string | null;
  // Source data
  emailIds: string[];
  emails: ParsedEmail[];
  extraction: ExtractedData | null;
  cluster: ProjectCluster | null;
  // Group assignment
  dateGroup: DateGroup;
  // Status (for future use)
  status: "pending" | "submitted" | "won" | "lost" | "no_bid";
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
