/**
 * Bid List Grouping Utilities
 * 
 * Functions for grouping bids by date and organizing them for display.
 */

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  isBefore,
  isAfter,
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
} from "./types";
import { DateGroupLabels, DateGroupPriority } from "./types";
import type { ExtractedData } from "@/lib/extraction/schemas";
import type { ParsedEmail } from "@/lib/gmail/types";
import type { ProjectCluster } from "@/lib/clustering/types";

/**
 * Determine which date group a bid belongs to
 */
export function getDateGroup(date: Date | null): DateGroup {
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

  return {
    id: extraction.emailId,
    projectName,
    projectAddress,
    purchaserCompany: extraction.purchaser?.companyName ?? null,
    purchaserContact: extraction.purchaser?.contactName ?? null,
    purchaserEmail: extraction.purchaser?.contactEmail ?? null,
    purchaserPhone: extraction.purchaser?.contactPhone ?? null,
    sellerName: extraction.inferredSeller?.seller?.name ?? null,
    sellerEmail: extraction.inferredSeller?.seller?.email ?? null,
    bidDueDate,
    bidDueTime,
    emailIds: [extraction.emailId],
    emails: [email],
    extraction,
    cluster: cluster ?? null,
    dateGroup: getDateGroup(bidDueDate),
    status: "pending",
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
      if (!a.bidDueDate && !b.bidDueDate) return 0;
      if (!a.bidDueDate) return 1;
      if (!b.bidDueDate) return -1;
      return a.bidDueDate.getTime() - b.bidDueDate.getTime();
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
 * Create a grouped bid list from extractions
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
  const bids: BidItem[] = [];
  for (const extraction of extractions) {
    const email = emailMap.get(extraction.emailId);
    if (email) {
      const cluster = clusterByEmailId.get(extraction.emailId);
      bids.push(createBidFromExtraction(extraction, email, cluster));
    }
  }

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

/**
 * Merge bids that belong to the same project cluster
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

    // Merge multiple bids into one
    const cluster = clusterBids[0].cluster!;
    const allEmails = clusterBids.flatMap((b) => b.emails);
    const allEmailIds = clusterBids.flatMap((b) => b.emailIds);

    // Find earliest due date
    const dates = clusterBids
      .filter((b) => b.bidDueDate)
      .map((b) => b.bidDueDate!)
      .sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = dates[0] ?? null;

    // Collect unique purchasers (take first non-null values)
    const purchaserCompany = clusterBids.find((b) => b.purchaserCompany)?.purchaserCompany ?? null;
    const purchaserContact = clusterBids.find((b) => b.purchaserContact)?.purchaserContact ?? null;
    const purchaserEmail = clusterBids.find((b) => b.purchaserEmail)?.purchaserEmail ?? null;
    const purchaserPhone = clusterBids.find((b) => b.purchaserPhone)?.purchaserPhone ?? null;

    // Collect seller info
    const sellerName = clusterBids.find((b) => b.sellerName)?.sellerName ?? null;
    const sellerEmail = clusterBids.find((b) => b.sellerEmail)?.sellerEmail ?? null;

    mergedBids.push({
      id: clusterId,
      projectName: cluster.project.name,
      projectAddress: cluster.project.address,
      purchaserCompany,
      purchaserContact,
      purchaserEmail,
      purchaserPhone,
      sellerName,
      sellerEmail,
      bidDueDate: earliestDate,
      bidDueTime: clusterBids.find((b) => b.bidDueTime)?.bidDueTime ?? null,
      emailIds: [...new Set(allEmailIds)],
      emails: allEmails,
      extraction: clusterBids[0].extraction,
      cluster,
      dateGroup: getDateGroup(earliestDate),
      status: "pending",
    });
  }

  return [...mergedBids, ...unclusteredBids];
}
