"use client";

import { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Calendar } from "lucide-react";
import type { BidItem, DateGroup } from "@/lib/bids/types";

interface BidCalendarProps {
  bids: BidItem[];
  onDayClick?: (date: Date) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  bidCount: number;
  urgency: DateGroup | null;
}

/**
 * Get the urgency level for a date based on bid due dates
 */
function getUrgency(date: Date): DateGroup {
  const today = startOfDay(new Date());
  if (isBefore(date, today)) return "overdue";
  if (isSameDay(date, today)) return "today";
  return "this_week"; // Use as "upcoming"
}

/**
 * Get CSS classes for urgency dot
 */
function getUrgencyClasses(urgency: DateGroup | null): string {
  switch (urgency) {
    case "overdue":
      return "bg-red-500";
    case "today":
      return "bg-yellow-500";
    default:
      return "bg-bv-blue-500";
  }
}

export function BidCalendar({ 
  bids, 
  onDayClick, 
  isCollapsed = false,
  onToggleCollapse 
}: BidCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Build a map of dates to bid counts and urgency
  const bidsByDate = useMemo(() => {
    const map = new Map<string, { count: number; urgency: DateGroup }>();
    
    for (const bid of bids) {
      // Check all purchasers for due dates
      for (const purchaser of bid.purchasers) {
        if (purchaser.dueDate) {
          const dateKey = format(purchaser.dueDate, "yyyy-MM-dd");
          const existing = map.get(dateKey);
          const urgency = getUrgency(purchaser.dueDate);
          
          if (existing) {
            existing.count++;
            // Keep the most urgent status
            if (urgency === "overdue" || (urgency === "today" && existing.urgency !== "overdue")) {
              existing.urgency = urgency;
            }
          } else {
            map.set(dateKey, { count: 1, urgency });
          }
        }
      }
    }
    
    return map;
  }, [bids]);

  // Calculate summary counts
  const summary = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let upcoming = 0;
    
    for (const [, value] of bidsByDate) {
      if (value.urgency === "overdue") overdue += value.count;
      else if (value.urgency === "today") today += value.count;
      else upcoming += value.count;
    }
    
    return { overdue, today, upcoming };
  }, [bidsByDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: DayInfo[] = [];
    let day = startDate;

    while (day <= endDate) {
      const dateKey = format(day, "yyyy-MM-dd");
      const bidInfo = bidsByDate.get(dateKey);
      
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isToday(day),
        bidCount: bidInfo?.count || 0,
        urgency: bidInfo?.urgency || null,
      });
      
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth, bidsByDate]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center justify-start pt-4 bg-white border-l border-neutral-200">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
          title="Show calendar"
        >
          <PanelRightOpen className="h-5 w-5 text-neutral-500" />
        </button>
        <div className="mt-2 writing-mode-vertical text-xs text-neutral-400 font-medium">
          CALENDAR
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-700">Calendar</span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          title="Hide calendar"
        >
          <PanelRightClose className="h-4 w-4 text-neutral-400" />
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-neutral-600" />
        </button>
        <span className="text-sm font-medium text-neutral-800">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-neutral-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 px-3 pb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-neutral-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 px-3 gap-y-1">
        {calendarDays.map((dayInfo, index) => (
          <button
            key={index}
            onClick={() => dayInfo.bidCount > 0 && onDayClick?.(dayInfo.date)}
            disabled={dayInfo.bidCount === 0}
            className={`
              relative flex flex-col items-center justify-center h-9 rounded-md
              transition-colors
              ${dayInfo.isCurrentMonth ? "text-neutral-800" : "text-neutral-300"}
              ${dayInfo.isToday ? "ring-2 ring-bv-blue-500 ring-inset" : ""}
              ${dayInfo.bidCount > 0 ? "hover:bg-neutral-100 cursor-pointer" : "cursor-default"}
            `}
          >
            <span className={`text-sm ${dayInfo.isToday ? "font-semibold" : ""}`}>
              {format(dayInfo.date, "d")}
            </span>
            {dayInfo.bidCount > 0 && (
              <div
                className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${getUrgencyClasses(dayInfo.urgency)}`}
                title={`${dayInfo.bidCount} bid${dayInfo.bidCount > 1 ? "s" : ""} due`}
              />
            )}
          </button>
        ))}
      </div>

      {/* Summary Legend */}
      <div className="mt-auto px-4 py-3 border-t border-neutral-200 space-y-1">
        {summary.overdue > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-neutral-600">{summary.overdue} overdue</span>
          </div>
        )}
        {summary.today > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-neutral-600">{summary.today} due today</span>
          </div>
        )}
        {summary.upcoming > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-bv-blue-500" />
            <span className="text-neutral-600">{summary.upcoming} upcoming</span>
          </div>
        )}
        {summary.overdue + summary.today + summary.upcoming === 0 && (
          <div className="text-xs text-neutral-400 text-center py-2">
            No bids in this month
          </div>
        )}
      </div>
    </div>
  );
}
