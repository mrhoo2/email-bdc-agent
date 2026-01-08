"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, RefreshCw, Play, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ParsedEmail } from "@/lib/gmail/types";
import { format } from "date-fns";

interface EmailPanelProps {
  isConnected: boolean;
  onConnectionRequired: () => void;
  onEmailsLoaded: (emails: ParsedEmail[]) => void;
  highlightEmailId?: string | null;
  onProcessEmail?: (email: ParsedEmail) => void;
  onProcessAll?: () => void;
  isProcessing?: boolean;
  hideRefreshButton?: boolean;
}

export default function EmailPanel({
  isConnected,
  onConnectionRequired,
  onEmailsLoaded,
  highlightEmailId,
  onProcessEmail,
  onProcessAll,
  isProcessing = false,
  hideRefreshButton = false,
}: EmailPanelProps) {
  const [emails, setEmails] = useState<ParsedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);

  // Fetch emails when connected
  const fetchEmails = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/emails?maxResults=20");
      const data = await response.json();

      if (data.success) {
        setEmails(data.emails);
        onEmailsLoaded(data.emails);
      } else {
        setError(data.error || "Failed to fetch emails");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, onEmailsLoaded]);

  // Auto-fetch emails when connected
  useEffect(() => {
    if (isConnected) {
      fetchEmails();
    }
  }, [isConnected, fetchEmails]);

  // Auto-select highlighted email
  useEffect(() => {
    if (highlightEmailId && highlightEmailId !== selectedEmailId) {
      setSelectedEmailId(highlightEmailId);
    }
  }, [highlightEmailId, selectedEmailId]);

  const toggleEmail = (emailId: string) => {
    setSelectedEmailId(selectedEmailId === emailId ? null : emailId);
  };

  const handleProcessEmail = async (email: ParsedEmail, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProcessEmail) {
      setProcessingEmailId(email.id);
      await onProcessEmail(email);
      setProcessingEmailId(null);
    }
  };

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-6 border-r border-neutral-200">
        <Mail className="h-12 w-12 text-neutral-300 mb-4" />
        <p className="text-sm text-neutral-500 mb-4 text-center">
          Gmail not connected
        </p>
        <button
          onClick={onConnectionRequired}
          className="px-4 py-2 bg-bv-blue-400 text-white rounded-md text-sm font-medium hover:bg-bv-blue-500"
        >
          Connect Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-neutral-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">
            Emails {emails.length > 0 && `(${emails.length})`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onProcessAll && (
            <button
              onClick={onProcessAll}
              disabled={isProcessing || emails.length === 0}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-bv-blue-400 hover:bg-bv-blue-500 rounded disabled:opacity-50"
              title="Process all emails"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Process All
            </button>
          )}
          <button
            onClick={fetchEmails}
            disabled={isLoading || isProcessing}
            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500"
            title="Refresh emails"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Email List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-neutral-100">
          {isLoading && emails.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading emails...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-red-500">{error}</div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              No emails found
            </div>
          ) : (
            emails.map((email) => (
              <div key={email.id}>
                {/* Email Row */}
                <div
                  onClick={() => toggleEmail(email.id)}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    selectedEmailId === email.id ? "bg-bv-blue-50" : ""
                  } ${highlightEmailId === email.id ? "ring-2 ring-inset ring-bv-blue-400" : ""}`}
                >
                  {/* Expand/Collapse Icon */}
                  <div className="pt-0.5">
                    {selectedEmailId === email.id ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>

                  {/* Email Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-neutral-900 truncate">
                        {email.from.name || email.from.email}
                      </span>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {format(new Date(email.date), "MMM d")}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 truncate mt-0.5">
                      {email.subject}
                    </p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {(typeof email.body === 'string' ? email.body : email.body?.text)?.slice(0, 80)}...
                    </p>
                  </div>

                  {/* Process Single Email Button */}
                  {onProcessEmail && (
                    <button
                      onClick={(e) => handleProcessEmail(email, e)}
                      disabled={processingEmailId === email.id}
                      className="p-1.5 hover:bg-bv-blue-100 rounded text-bv-blue-400 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                      style={{ opacity: processingEmailId === email.id ? 1 : undefined }}
                      title="Process this email"
                    >
                      {processingEmailId === email.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Email Detail */}
                {selectedEmailId === email.id && selectedEmail && (
                  <div className="bg-neutral-50 border-t border-neutral-100">
                    <ScrollArea className="max-h-[300px]">
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-xs font-medium text-neutral-500">From:</span>
                          <p className="text-xs text-neutral-700">
                            {selectedEmail.from.name} &lt;{selectedEmail.from.email}&gt;
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-neutral-500">To:</span>
                          <p className="text-xs text-neutral-700">
                            {selectedEmail.to.map((t) => t.email).join(", ")}
                          </p>
                        </div>
                        {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-neutral-500">CC:</span>
                            <p className="text-xs text-neutral-700">
                              {selectedEmail.cc.map((c) => c.email).join(", ")}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-medium text-neutral-500">Subject:</span>
                          <p className="text-xs text-neutral-700 font-medium">
                            {selectedEmail.subject}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-neutral-500">Body:</span>
                          <div className="mt-1 p-2 bg-white rounded border border-neutral-200 text-xs text-neutral-700 whitespace-pre-wrap">
                            {typeof selectedEmail.body === 'string' 
                              ? selectedEmail.body 
                              : selectedEmail.body?.text || ''}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
