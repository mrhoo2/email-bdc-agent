"use client";

import { format } from "date-fns";
import { MapPin, User, Mail, Phone, Clock, ChevronDown, ChevronUp, Users, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { BidItem, Purchaser, DateGroup } from "@/lib/bids/types";
import { Badge } from "@/components/ui/badge";

interface BidCardProps {
  bid: BidItem;
  onEmailClick?: (emailId: string) => void;
}

/**
 * Get the color classes for a date group
 */
function getDateGroupColors(dateGroup: DateGroup): string {
  switch (dateGroup) {
    case "overdue":
      return "bg-red-100 text-red-700 border-red-200";
    case "today":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "tomorrow":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

/**
 * Get label for purchaser source
 */
function getSourceLabel(source: Purchaser["source"]): string | null {
  switch (source) {
    case "signature":
      return "From signature";
    case "forwarded":
      return "From forwarded";
    case "body":
      return null; // Don't show for body extraction (most common)
    case "header":
      return null; // Don't show for header (expected)
    case "inferred":
      return "AI inferred";
    default:
      return null;
  }
}

/**
 * Individual purchaser card within a bid
 */
function PurchaserCard({ 
  purchaser, 
  isFirst 
}: { 
  purchaser: Purchaser; 
  isFirst: boolean;
}) {
  const dateGroupColors = getDateGroupColors(purchaser.dateGroup);
  const sourceLabel = getSourceLabel(purchaser.source);

  return (
    <div className={`p-3 rounded-md border ${isFirst ? 'bg-white' : 'bg-neutral-50'} border-neutral-200`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-800">
            {purchaser.companyName}
          </div>
          {purchaser.contactName && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500">
              <User className="h-3 w-3" />
              <span>{purchaser.contactName}</span>
            </div>
          )}
          {purchaser.contactEmail && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500">
              <Mail className="h-3 w-3" />
              <span className="truncate">{purchaser.contactEmail}</span>
            </div>
          )}
          {purchaser.contactPhone && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500">
              <Phone className="h-3 w-3" />
              <span>{purchaser.contactPhone}</span>
            </div>
          )}
          {sourceLabel && (
            <div className="mt-1 text-xs text-neutral-400 italic">
              {sourceLabel}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {purchaser.dueDate ? (
            <>
              <Badge className={`text-xs ${dateGroupColors}`}>
                {purchaser.dateGroup === "overdue" && (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {format(purchaser.dueDate, "MMM d")}
              </Badge>
              {purchaser.dueTime && (
                <span className="text-xs text-neutral-400">@ {purchaser.dueTime}</span>
              )}
            </>
          ) : (
            <Badge className="text-xs bg-neutral-100 text-neutral-500">No date</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function BidCard({ bid, onEmailClick }: BidCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllPurchasers, setShowAllPurchasers] = useState(false);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    submitted: "bg-green-100 text-green-700",
    won: "bg-blue-100 text-blue-700",
    lost: "bg-neutral-100 text-neutral-600",
    no_bid: "bg-neutral-100 text-neutral-500",
  };

  const dateGroupColors = getDateGroupColors(bid.dateGroup);
  const hasManyPurchasers = bid.purchasers.length > 1;
  const displayedPurchasers = showAllPurchasers ? bid.purchasers : bid.purchasers.slice(0, 2);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
      {/* Header: Project Name + Status + Due Date */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-800 truncate">
            {bid.projectName || "Unknown Project"}
          </h3>
          {bid.projectAddress && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{bid.projectAddress}</span>
            </div>
          )}
          {bid.generalContractor && (
            <div className="mt-1 text-xs text-neutral-400">
              GC: {bid.generalContractor}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge className={statusColors[bid.status]}>
            {bid.status === "pending" ? "Pending" : bid.status}
          </Badge>
          {bid.earliestDueDate && (
            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${dateGroupColors}`}>
              <Clock className="h-3 w-3" />
              <span>{format(bid.earliestDueDate, "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Purchasers Section */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-neutral-400" />
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            Purchasers ({bid.purchasers.length})
          </span>
        </div>
        
        {bid.purchasers.length === 0 ? (
          <div className="text-sm text-neutral-400 italic p-3 bg-neutral-50 rounded">
            No purchaser identified
          </div>
        ) : (
          <div className="space-y-2">
            {displayedPurchasers.map((purchaser, index) => (
              <PurchaserCard 
                key={purchaser.emailId} 
                purchaser={purchaser} 
                isFirst={index === 0}
              />
            ))}
            
            {hasManyPurchasers && bid.purchasers.length > 2 && (
              <button
                onClick={() => setShowAllPurchasers(!showAllPurchasers)}
                className="w-full text-center text-xs text-bv-blue-600 hover:text-bv-blue-800 py-1"
              >
                {showAllPurchasers 
                  ? "Show less" 
                  : `+ ${bid.purchasers.length - 2} more purchaser${bid.purchasers.length - 2 > 1 ? 's' : ''}`
                }
              </button>
            )}
          </div>
        )}
      </div>

      {/* Seller Section */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Sales Rep
          </div>
          {bid.sellerName ? (
            <>
              <div className="text-sm font-medium text-neutral-700">
                {bid.sellerName}
              </div>
              {bid.sellerEmail && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{bid.sellerEmail}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-neutral-400">Not assigned</div>
          )}
        </div>
        
        {/* Stats */}
        <div className="text-right">
          <div className="text-xs text-neutral-400">
            {bid.emails.length} email{bid.emails.length !== 1 ? 's' : ''}
          </div>
          {hasManyPurchasers && (
            <div className="text-xs text-bv-blue-600 font-medium mt-1">
              Multi-contractor project
            </div>
          )}
        </div>
      </div>

      {/* Email List Toggle */}
      {bid.emails.length > 0 && (
        <div className="pt-3 border-t border-neutral-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>View {bid.emails.length} email{bid.emails.length !== 1 ? 's' : ''}</span>
          </button>

          {/* Expanded Email List */}
          {isExpanded && (
            <div className="mt-2 space-y-1">
              {bid.emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => onEmailClick?.(email.id)}
                  className="w-full text-left p-2 rounded bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="text-xs font-medium text-neutral-700 truncate">
                    {email.subject}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                    <span>{email.from.name || email.from.email}</span>
                    <span>•</span>
                    <span>{format(new Date(email.date), "MMM d")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
