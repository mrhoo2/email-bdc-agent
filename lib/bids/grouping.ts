/**
 * Bid List Grouping Utilities
 * 
 * Functions for grouping bids by date and organizing them for display.
 * Updated for GreenHack demo to support multiple purchasers per project.
 */

import {
  startOfDay,
  endOfWeek,
  addDays,
  addWeeks,
  isBefore,
  isToday,
  isTomorrow,
  isWithinInterval,
  parseISO,
} from "date-fns";
import type {
  BidItem,
  BidGroup,
  GroupedBidList,
  DateGroup,
  Purchaser,
  PurchaserSource,
} from "./types";
import { DateGroupLabels, DateGroupPriority } from "./types";
import type { ExtractedData, BidderSource } from "@/lib/extraction/schemas";
import type { ParsedEmail } from "@/lib/gmail/types";
import type { ProjectCluster } from "@/lib/clustering/types";

/**
 * Determine which date group a bid belongs to
 */
export function getDateGroup(date: Date | null | undefined): DateGroup {
  if (!date) return "no_date";

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const endOfNextWeek = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

  // Overdue: before today
  if (isBefore(date, today)) {
    return "overdue";
  }

  // Today
  if (isToday(date)) {
    return "today";
  }

  // Tomorrow
  if (isTomorrow(date)) {
    return "tomorrow";
  }

  // This week (after tomorrow, before end of this week)
  if (isWithinInterval(date, { start: addDays(tomorrow, 1), end: endOfThisWeek })) {
    return "this_week";
  }

  // Next week
  if (isWithinInterval(date, { start: addDays(endOfThisWeek, 1), end: endOfNextWeek })) {
    return "next_week";
  }

  // Later
  return "later";
}

/**
 * Convert BidderSource from extraction to PurchaserSource for bid types
 */
function mapBidderSource(source: BidderSource | undefined): PurchaserSource {
  return source ?? "body";
}

/**
 * Create a Purchaser from extraction data
 */
function createPurchaserFromExtraction(
  extraction: ExtractedData,
): Purchaser | null {
  if (!extraction.purchaser?.companyName) {
    return null;
  }

  // Get the earliest bid due date
  const dueDate = extraction.bidDueDates.length > 0
    ? parseISO(extraction.bidDueDates[0].date)
    : undefined;
  const dueTime = extraction.bidDueDates.length > 0
    ? extraction.bidDueDates[0].time ?? undefined
    : undefined;

  return {
    companyName: extraction.purchaser.companyName,
    contactName: extraction.purchaser.contactName ?? undefined,
    contactEmail: extraction.purchaser.contactEmail ?? undefined,
    contactPhone: extraction.purchaser.contactPhone ?? undefined,
    dueDate,
    dueTime,
    emailId: extraction.emailId,
    source: mapBidderSource(extraction.purchaser.source),
    dateGroup: getDateGroup(dueDate),
  };
}

/**
 * Create a BidItem from extraction data
 */
export function createBidFromExtraction(
  extraction: ExtractedData,
  email: ParsedEmail,
  cluster?: ProjectCluster | null
): BidItem {
  // Get the earliest bid due date
  const bidDueDate = extraction.bidDueDates.length > 0
    ? parseISO(extraction.bidDueDates[0].date)
    : null;
  const bidDueTime = extraction.bidDueDates.length > 0
    ? extraction.bidDueDates[0].time || null
    : null;

  // Get project info from cluster or extraction
  const projectName = cluster?.project?.name ?? extraction.projectSignals?.projectName ?? null;
  const projectAddress = cluster?.project?.address ?? extraction.projectSignals?.projectAddress ?? null;
  const generalContractor = cluster?.project?.generalContractor ?? extraction.projectSignals?.generalContractor ?? null;
  const engineer = cluster?.project?.engineer ?? extraction.projectSignals?.engineer ?? null;
  const architect = cluster?.project?.architect ?? extraction.projectSignals?.architect ?? null;

  // Create purchaser from extraction
  const purchaser = createPurchaserFromExtraction(extraction);
  const purchasers: Purchaser[] = purchaser ? [purchaser] : [];

  return {
    id: extraction.emailId,
    projectName,
    projectAddress,
    generalContractor,
    engineer,
    architect,
    
    // New purchasers array
    purchasers,
    
    // Seller info
    sellerName: extraction.inferredSeller?.seller?.name ?? null,
    sellerEmail: extraction.inferredSeller?.seller?.email ?? null,
    
    // Earliest due date (same as purchaser's for single-purchaser bid)
    earliestDueDate: bidDueDate,
    earliestDueTime: bidDueTime,
    
    // Source data
    emailIds: [extraction.emailId],
    emails: [email],
    extractions: [extraction],
    cluster: cluster ?? null,
    
    // Group assignment
    dateGroup: getDateGroup(bidDueDate),
    status: "pending",
    
    // Legacy fields for backwards compatibility
    purchaserCompany: extraction.purchaser?.companyName ?? null,
    purchaserContact: extraction.purchaser?.contactName ?? null,
    purchaserEmail: extraction.purchaser?.contactEmail ?? null,
    purchaserPhone: extraction.purchaser?.contactPhone ?? null,
    bidDueDate,
    bidDueTime,
    extraction,
  };
}

/**
 * Group bids by date
 */
export function groupBidsByDate(bids: BidItem[]): BidGroup[] {
  // Group bids by their date group
  const groupMap = new Map<DateGroup, BidItem[]>();

  for (const bid of bids) {
    const group = bid.dateGroup;
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)!.push(bid);
  }

  // Convert to array and sort by priority
  const groups: BidGroup[] = [];

  for (const [group, groupBids] of groupMap) {
    // Sort bids within group by date (earliest first)
    const sortedBids = groupBids.sort((a, b) => {
      if (!a.earliestDueDate && !b.earliestDueDate) return 0;
      if (!a.earliestDueDate) return 1;
      if (!b.earliestDueDate) return -1;
      return a.earliestDueDate.getTime() - b.earliestDueDate.getTime();
    });

    groups.push({
      group,
      label: DateGroupLabels[group],
      bids: sortedBids,
      count: sortedBids.length,
    });
  }

  // Sort groups by priority
  return groups.sort((a, b) => DateGroupPriority[a.group] - DateGroupPriority[b.group]);
}

/**
 * Merge bids that belong to the same project cluster.
 * Aggregates multiple purchasers into a single project-centric BidItem.
 */
export function mergeBidsByCluster(bids: BidItem[]): BidItem[] {
  // Group bids by cluster ID
  const clusterMap = new Map<string, BidItem[]>();
  const unclusteredBids: BidItem[] = [];

  for (const bid of bids) {
    if (bid.cluster?.id) {
      if (!clusterMap.has(bid.cluster.id)) {
        clusterMap.set(bid.cluster.id, []);
      }
      clusterMap.get(bid.cluster.id)!.push(bid);
    } else {
      unclusteredBids.push(bid);
    }
  }

  // Merge clustered bids
  const mergedBids: BidItem[] = [];

  for (const [clusterId, clusterBids] of clusterMap) {
    if (clusterBids.length === 1) {
      mergedBids.push(clusterBids[0]);
      continue;
    }

    // Merge multiple bids into one project-centric bid
    const cluster = clusterBids[0].cluster!;
    const allEmails = clusterBids.flatMap((b) => b.emails);
    const allEmailIds = [...new Set(clusterBids.flatMap((b) => b.emailIds))];
    const allExtractions = clusterBids.flatMap((b) => b.extractions);

    // Aggregate all purchasers from all bids (dedupe by company name)
    const purchaserMap = new Map<string, Purchaser>();
    for (const bid of clusterBids) {
      for (const purchaser of bid.purchasers) {
        // Use company name as key (case-insensitive)
        const key = purchaser.companyName.toLowerCase().trim();
        if (!purchaserMap.has(key)) {
          purchaserMap.set(key, purchaser);
        }
      }
    }
    const allPurchasers = Array.from(purchaserMap.values());

    // Find earliest due date across all purchasers
    const allDates = allPurchasers
      .filter((p) => p.dueDate)
      .map((p) => p.dueDate!)
      .sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = allDates[0] ?? null;
    const earliestTime = earliestDate 
      ? allPurchasers.find((p) => p.dueDate?.getTime() === earliestDate.getTime())?.dueTime ?? null
      : null;

    // Collect seller info (take first non-null)
    const sellerName = clusterBids.find((b) => b.sellerName)?.sellerName ?? null;
    const sellerEmail = clusterBids.find((b) => b.sellerEmail)?.sellerEmail ?? null;

    // For legacy fields, use first purchaser
    const firstPurchaser = allPurchasers[0];

    mergedBids.push({
      id: clusterId,
      projectName: cluster.project.name ?? null,
      projectAddress: cluster.project.address ?? null,
      generalContractor: cluster.project.generalContractor ?? null,
      engineer: cluster.project.engineer ?? null,
      architect: cluster.project.architect ?? null,
      
      // Aggregated purchasers
      purchasers: allPurchasers,
      
      // Seller info
      sellerName,
      sellerEmail,
      
      // Earliest due date across all purchasers
      earliestDueDate: earliestDate,
      earliestDueTime: earliestTime,
      
      // Source data
      emailIds: allEmailIds,
      emails: allEmails,
      extractions: allExtractions,
      cluster,
      
      // Group assignment
      dateGroup: getDateGroup(earliestDate),
      status: "pending",
      
      // Legacy fields
      purchaserCompany: firstPurchaser?.companyName ?? null,
      purchaserContact: firstPurchaser?.contactName ?? null,
      purchaserEmail: firstPurchaser?.contactEmail ?? null,
      purchaserPhone: firstPurchaser?.contactPhone ?? null,
      bidDueDate: earliestDate,
      bidDueTime: earliestTime,
      extraction: allExtractions[0] ?? null,
    });
  }

  return [...mergedBids, ...unclusteredBids];
}

/**
 * Create a grouped bid list from extractions.
 * This is the main entry point for processing extractions into a display-ready bid list.
 */
export function createGroupedBidList(
  extractions: ExtractedData[],
  emails: ParsedEmail[],
  clusters?: ProjectCluster[]
): GroupedBidList {
  // Create email lookup map
  const emailMap = new Map<string, ParsedEmail>();
  for (const email of emails) {
    emailMap.set(email.id, email);
  }

  // Create cluster lookup map by email ID
  const clusterByEmailId = new Map<string, ProjectCluster>();
  if (clusters) {
    for (const cluster of clusters) {
      for (const emailId of cluster.emailIds) {
        clusterByEmailId.set(emailId, cluster);
      }
    }
  }

  // Create bids from extractions
  let bids: BidItem[] = [];
  for (const extraction of extractions) {
    const email = emailMap.get(extraction.emailId);
    if (email) {
      const cluster = clusterByEmailId.get(extraction.emailId);
      bids.push(createBidFromExtraction(extraction, email, cluster));
    }
  }

  // Merge bids by cluster to consolidate same-project purchasers
  bids = mergeBidsByCluster(bids);

  // Group by date
  const groups = groupBidsByDate(bids);

  // Calculate summary
  const summary = {
    totalBids: bids.length,
    totalEmails: emails.length,
    overdueCount: groups.find((g) => g.group === "overdue")?.count ?? 0,
    todayCount: groups.find((g) => g.group === "today")?.count ?? 0,
    upcomingCount: bids.filter((b) => 
      b.dateGroup !== "overdue" && 
      b.dateGroup !== "no_date"
    ).length,
  };

  return {
    groups,
    summary,
    generatedAt: new Date(),
  };
}
