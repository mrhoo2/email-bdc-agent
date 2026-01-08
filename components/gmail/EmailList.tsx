"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import {
  RefreshCw,
  Mail,
  Paperclip,
  ChevronRight,
  AlertCircle,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ParsedEmail } from "@/lib/gmail/types";

interface EmailListProps {
  isConnected: boolean;
  onEmailSelect?: (email: ParsedEmail) => void;
}

interface FetchState {
  isLoading: boolean;
  error: string | null;
  emails: ParsedEmail[];
  nextPageToken?: string;
  total?: number;
}

export function EmailList({ isConnected, onEmailSelect }: EmailListProps) {
  const [fetchState, setFetchState] = useState<FetchState>({
    isLoading: false,
    error: null,
    emails: [],
  });
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const fetchEmails = useCallback(async (pageToken?: string) => {
    setFetchState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({
        maxResults: "20",
      });
      if (pageToken) {
        params.set("pageToken", pageToken);
      }

      const response = await fetch(`/api/emails?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }

      setFetchState((prev) => ({
        isLoading: false,
        error: null,
        emails: pageToken ? [...prev.emails, ...data.emails] : data.emails,
        nextPageToken: data.nextPageToken,
        total: data.totalEstimate,
      }));
    } catch (error) {
      setFetchState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch emails",
      }));
    }
  }, []);

  const handleRefresh = () => {
    fetchEmails();
  };

  const handleLoadMore = () => {
    if (fetchState.nextPageToken) {
      fetchEmails(fetchState.nextPageToken);
    }
  };

  const handleEmailClick = (email: ParsedEmail) => {
    setSelectedEmailId(email.id);
    onEmailSelect?.(email);
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Email Inbox
          </CardTitle>
          <CardDescription>
            Connect your Gmail account to view emails
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Mail className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-body-sm">No Gmail account connected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              Email Inbox
            </CardTitle>
            <CardDescription>
              {fetchState.emails.length > 0
                ? `${fetchState.emails.length} emails loaded${fetchState.total ? ` of ~${fetchState.total}` : ""}`
                : "Click refresh to load emails"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={fetchState.isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${fetchState.isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fetchState.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-detail flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {fetchState.error}
          </div>
        )}

        {fetchState.emails.length === 0 && !fetchState.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-body-sm mb-2">No emails loaded</p>
            <Button variant="secondary" size="sm" onClick={handleRefresh}>
              Load Emails
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {fetchState.emails.map((email, index) => (
                <div key={email.id}>
                  <EmailListItem
                    email={email}
                    isSelected={selectedEmailId === email.id}
                    onClick={() => handleEmailClick(email)}
                  />
                  {index < fetchState.emails.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>

            {fetchState.nextPageToken && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={fetchState.isLoading}
                >
                  {fetchState.isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface EmailListItemProps {
  email: ParsedEmail;
  isSelected: boolean;
  onClick: () => void;
}

function EmailListItem({ email, isSelected, onClick }: EmailListItemProps) {
  const fromName = email.from.name || email.from.email;
  const hasAttachments = email.attachments.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-body-sm text-foreground truncate">
              {fromName}
            </span>
            {hasAttachments && (
              <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-detail font-medium text-foreground truncate mb-1">
            {email.subject}
          </p>
          <p className="text-micro text-muted-foreground line-clamp-2">
            {email.snippet}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-micro text-muted-foreground">
            {format(new Date(email.date), "MMM d")}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      {email.labels.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {email.labels.slice(0, 3).map((label) => (
            <Badge key={label} variant="secondary" className="text-micro">
              {formatLabelName(label)}
            </Badge>
          ))}
          {email.labels.length > 3 && (
            <Badge variant="secondary" className="text-micro">
              +{email.labels.length - 3}
            </Badge>
          )}
        </div>
      )}
    </button>
  );
}

function formatLabelName(label: string): string {
  // Convert Gmail label IDs to readable names
  const labelMap: Record<string, string> = {
    INBOX: "Inbox",
    SENT: "Sent",
    DRAFT: "Draft",
    SPAM: "Spam",
    TRASH: "Trash",
    STARRED: "Starred",
    IMPORTANT: "Important",
    UNREAD: "Unread",
    CATEGORY_PERSONAL: "Personal",
    CATEGORY_SOCIAL: "Social",
    CATEGORY_PROMOTIONS: "Promotions",
    CATEGORY_UPDATES: "Updates",
    CATEGORY_FORUMS: "Forums",
  };

  return labelMap[label] || label.replace(/_/g, " ");
}
