"use client";

import { format } from "date-fns";
import { MapPin, User, Mail, Phone, UserCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { BidItem } from "@/lib/bids/types";
import { Badge } from "@/components/ui/badge";

interface BidCardProps {
  bid: BidItem;
  onEmailClick?: (emailId: string) => void;
}

export function BidCard({ bid, onEmailClick }: BidCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    submitted: "bg-green-100 text-green-700",
    won: "bg-blue-100 text-blue-700",
    lost: "bg-neutral-100 text-neutral-600",
    no_bid: "bg-neutral-100 text-neutral-500",
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
      {/* Header: Project Name + Due Date */}
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
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge className={statusColors[bid.status]}>
            {bid.status === "pending" ? "Pending" : bid.status}
          </Badge>
          {bid.bidDueDate && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Clock className="h-3 w-3" />
              <span>{format(bid.bidDueDate, "MMM d, yyyy")}</span>
              {bid.bidDueTime && <span>@ {bid.bidDueTime}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Bidder + Seller */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bidder (Purchaser) */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Bidder
          </div>
          <div className="text-sm font-medium text-neutral-700">
            {bid.purchaserCompany || "—"}
          </div>
          {bid.purchaserContact && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <User className="h-3 w-3" />
              <span>{bid.purchaserContact}</span>
            </div>
          )}
          {bid.purchaserEmail && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Mail className="h-3 w-3" />
              <span className="truncate">{bid.purchaserEmail}</span>
            </div>
          )}
          {bid.purchaserPhone && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Phone className="h-3 w-3" />
              <span>{bid.purchaserPhone}</span>
            </div>
          )}
        </div>

        {/* Seller */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Seller
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
      </div>

      {/* Email Count + Expand */}
      {bid.emails.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>{bid.emails.length} email{bid.emails.length !== 1 ? "s" : ""}</span>
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
