"use client";

import { format } from "date-fns";
import {
  Mail,
  Calendar,
  User,
  Users,
  Paperclip,
  ExternalLink,
  X,
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

interface EmailViewerProps {
  email: ParsedEmail | null;
  onClose?: () => void;
}

export function EmailViewer({ email, onClose }: EmailViewerProps) {
  if (!email) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
          <Mail className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-body-sm">Select an email to view</p>
        </CardContent>
      </Card>
    );
  }

  const recipients = [
    ...email.to.map((addr) => ({ ...addr, type: "To" as const })),
    ...email.cc.map((addr) => ({ ...addr, type: "CC" as const })),
    ...email.bcc.map((addr) => ({ ...addr, type: "BCC" as const })),
  ];

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-h5 mb-2 break-words">
              {email.subject}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(email.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px]">
          {/* Sender */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-detail text-muted-foreground mb-1">
              <User className="w-4 h-4" />
              <span>From</span>
            </div>
            <div className="pl-6">
              <span className="font-medium text-body-sm">
                {email.from.name || email.from.email}
              </span>
              {email.from.name && (
                <span className="text-detail text-muted-foreground ml-2">
                  &lt;{email.from.email}&gt;
                </span>
              )}
            </div>
          </div>

          {/* Recipients */}
          {recipients.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-detail text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span>Recipients</span>
              </div>
              <div className="pl-6 space-y-1">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-micro">
                      {recipient.type}
                    </Badge>
                    <span className="text-body-sm">
                      {recipient.name || recipient.email}
                      {recipient.name && (
                        <span className="text-detail text-muted-foreground ml-2">
                          &lt;{recipient.email}&gt;
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-detail text-muted-foreground mb-2">
                <Paperclip className="w-4 h-4" />
                <span>{email.attachments.length} Attachment(s)</span>
              </div>
              <div className="pl-6 flex flex-wrap gap-2">
                {email.attachments.map((attachment, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Paperclip className="w-3 h-3" />
                    {attachment.filename}
                    <span className="text-muted-foreground ml-1">
                      ({formatFileSize(attachment.size)})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {email.labels.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-detail text-muted-foreground mb-2">
                <span>Labels</span>
              </div>
              <div className="pl-6 flex flex-wrap gap-1">
                {email.labels.map((label) => (
                  <Badge key={label} variant="outline" className="text-micro">
                    {formatLabelName(label)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Email Body */}
          <div className="space-y-4">
            {email.body.html ? (
              <div className="relative">
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const win = window.open("", "_blank");
                      if (win) {
                        win.document.write(email.body.html!);
                        win.document.close();
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open HTML
                  </Button>
                </div>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body.html) }}
                />
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-body-sm font-mono bg-muted p-4 rounded-md">
                {email.body.text || "(No content)"}
              </div>
            )}
          </div>

          {/* Thread ID */}
          <div className="mt-6 pt-4 border-t text-micro text-muted-foreground">
            <div className="flex gap-4">
              <span>Message ID: {email.id}</span>
              <span>Thread ID: {email.threadId}</span>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLabelName(label: string): string {
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

function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - removes script tags and event handlers
  // For production, use a proper sanitization library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=/gi, " data-removed=")
    .replace(/javascript:/gi, "blocked:");
}
