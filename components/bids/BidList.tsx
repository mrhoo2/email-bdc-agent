"use client";

import { format } from "date-fns";
import { Calendar, AlertTriangle, Clock, CalendarDays, CalendarRange, CalendarX } from "lucide-react";
import { BidCard } from "./BidCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GroupedBidList, DateGroup } from "@/lib/bids/types";

interface BidListProps {
  bidList: GroupedBidList | null;
  onEmailClick?: (emailId: string) => void;
  isLoading?: boolean;
}

const groupIcons: Record<DateGroup, React.ReactNode> = {
  overdue: <AlertTriangle className="h-4 w-4 text-red-500" />,
  today: <Clock className="h-4 w-4 text-yellow-500" />,
  tomorrow: <Calendar className="h-4 w-4 text-blue-500" />,
  this_week: <CalendarDays className="h-4 w-4 text-neutral-500" />,
  next_week: <CalendarRange className="h-4 w-4 text-neutral-400" />,
  later: <CalendarRange className="h-4 w-4 text-neutral-300" />,
  no_date: <CalendarX className="h-4 w-4 text-neutral-300" />,
};

const groupColors: Record<DateGroup, string> = {
  overdue: "text-red-600 bg-red-50 border-red-200",
  today: "text-yellow-700 bg-yellow-50 border-yellow-200",
  tomorrow: "text-blue-600 bg-blue-50 border-blue-200",
  this_week: "text-neutral-700 bg-neutral-50 border-neutral-200",
  next_week: "text-neutral-600 bg-neutral-50 border-neutral-200",
  later: "text-neutral-500 bg-neutral-50 border-neutral-200",
  no_date: "text-neutral-400 bg-neutral-50 border-neutral-200",
};

export function BidList({ bidList, onEmailClick, isLoading }: BidListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-neutral-500">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-32 bg-neutral-100 rounded"></div>
          <div className="h-32 bg-neutral-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!bidList || bidList.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-neutral-500">
        <CalendarX className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm font-medium">No bids to display</p>
        <p className="text-xs text-neutral-400 mt-1">
          Process emails to extract bid information
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Summary Header */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800">Bid List</h2>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span>{bidList.summary.totalBids} bids</span>
            {bidList.summary.overdueCount > 0 && (
              <span className="text-red-500 font-medium">
                {bidList.summary.overdueCount} overdue
              </span>
            )}
            {bidList.summary.todayCount > 0 && (
              <span className="text-yellow-600 font-medium">
                {bidList.summary.todayCount} due today
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Generated {format(bidList.generatedAt, "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      {/* Grouped Bid Cards */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {bidList.groups.map((group) => (
            <div key={group.group}>
              {/* Group Header */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md border mb-3 ${groupColors[group.group]}`}
              >
                {groupIcons[group.group]}
                <span className="font-medium text-sm">{group.label}</span>
                <span className="text-xs opacity-70">({group.count})</span>
              </div>

              {/* Bid Cards */}
              <div className="space-y-3 pl-2">
                {group.bids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    onEmailClick={onEmailClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
