"use client";

/**
 * Extraction Card Component
 * 
 * Displays extracted entity data from an email using Gemini 3 Pro.
 * Shows purchaser info, project signals, and bid due dates.
 */

import { useState } from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  HardHat,
  Pencil,
  Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ParsedEmail } from "@/lib/gmail/types";
import type { ExtractedData } from "@/lib/extraction/schemas";

// ============================================
// Types
// ============================================

interface ExtractionCardProps {
  email: ParsedEmail | null;
  onExtractionComplete?: (data: ExtractedData) => void;
}

// ============================================
// Utility Functions
// ============================================

function getConfidenceBadgeVariant(
  confidence: number
): "default" | "secondary" | "destructive" | "outline" {
  if (confidence >= 0.8) return "default";
  if (confidence >= 0.5) return "secondary";
  return "destructive";
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ============================================
// Main Component
// ============================================

export function ExtractionCard({
  email,
  onExtractionComplete,
}: ExtractionCardProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!email) return;

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailId: email.id }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setExtractedData(result.data);
        onExtractionComplete?.(result.data);
      } else {
        setError(result.error || "Extraction failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsExtracting(false);
    }
  };

  // No email selected
  if (!email) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground p-8">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-body-md">Select an email to extract entities</p>
          <p className="text-micro mt-2">
            Uses Gemini 3 Pro to identify purchasers, projects, and bid dates
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-body-lg">Entity Extraction</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={handleExtract}
            disabled={isExtracting}
            className="gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                {extractedData ? "Re-Extract" : "Extract"}
              </>
            )}
          </Button>
        </div>
        <p className="text-micro text-muted-foreground mt-1">
          From: {email.subject}
        </p>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-md mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-detail">{error}</p>
          </div>
        )}

        {/* Not Yet Extracted */}
        {!extractedData && !isExtracting && !error && (
          <div className="text-center text-muted-foreground py-12">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-body-md">Ready to extract</p>
            <p className="text-micro mt-2">
              Click "Extract" to analyze this email with Gemini 3 Pro
            </p>
          </div>
        )}

        {/* Loading State */}
        {isExtracting && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-body-md text-muted-foreground">
              Analyzing email with Gemini 3 Pro...
            </p>
          </div>
        )}

        {/* Extracted Data */}
        {extractedData && !isExtracting && (
          <div className="space-y-6">
            {/* Overall Confidence */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-detail font-medium">
                  Extraction Complete
                </span>
              </div>
              <Badge variant={getConfidenceBadgeVariant(extractedData.confidence)}>
                {formatConfidence(extractedData.confidence)} confidence
              </Badge>
            </div>

            {/* Purchaser Identity */}
            <PurchaserSection purchaser={extractedData.purchaser} />

            <Separator />

            {/* Project Signals */}
            <ProjectSection projectSignals={extractedData.projectSignals} />

            <Separator />

            {/* Bid Due Dates */}
            <BidDatesSection bidDueDates={extractedData.bidDueDates} />

            {/* Extraction Notes */}
            {extractedData.extractionNotes.length > 0 && (
              <>
                <Separator />
                <NotesSection notes={extractedData.extractionNotes} />
              </>
            )}

            {/* Metadata */}
            <div className="text-micro text-muted-foreground pt-2 border-t">
              Extracted at{" "}
              {new Date(extractedData.extractedAt).toLocaleString()} using{" "}
              {extractedData.provider}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Sub-Components
// ============================================

function PurchaserSection({
  purchaser,
}: {
  purchaser: ExtractedData["purchaser"];
}) {
  if (!purchaser) {
    return (
      <div>
        <h3 className="text-detail font-semibold mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Purchaser
        </h3>
        <p className="text-micro text-muted-foreground italic">
          No purchaser identified
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-detail font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Purchaser
        </h3>
        <Badge
          variant={getConfidenceBadgeVariant(purchaser.confidence)}
          className="text-micro"
        >
          {formatConfidence(purchaser.confidence)}
        </Badge>
      </div>

      <div className="space-y-2 pl-6">
        <p className="text-body-sm font-medium">{purchaser.companyName}</p>

        {purchaser.contactName && (
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <User className="w-3 h-3" />
            {purchaser.contactName}
          </div>
        )}

        {purchaser.contactEmail && (
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <Mail className="w-3 h-3" />
            {purchaser.contactEmail}
          </div>
        )}

        {purchaser.contactPhone && (
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <Phone className="w-3 h-3" />
            {purchaser.contactPhone}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectSection({
  projectSignals,
}: {
  projectSignals: ExtractedData["projectSignals"];
}) {
  if (!projectSignals) {
    return (
      <div>
        <h3 className="text-detail font-semibold mb-2 flex items-center gap-2">
          <HardHat className="w-4 h-4" />
          Project Signals
        </h3>
        <p className="text-micro text-muted-foreground italic">
          No project details identified
        </p>
      </div>
    );
  }

  const hasAnyData =
    projectSignals.projectName ||
    projectSignals.projectAddress ||
    projectSignals.generalContractor ||
    projectSignals.engineer ||
    projectSignals.architect;

  if (!hasAnyData) {
    return (
      <div>
        <h3 className="text-detail font-semibold mb-2 flex items-center gap-2">
          <HardHat className="w-4 h-4" />
          Project Signals
        </h3>
        <p className="text-micro text-muted-foreground italic">
          No project details identified
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-detail font-semibold flex items-center gap-2">
          <HardHat className="w-4 h-4" />
          Project Signals
        </h3>
        <Badge
          variant={getConfidenceBadgeVariant(projectSignals.confidence)}
          className="text-micro"
        >
          {formatConfidence(projectSignals.confidence)}
        </Badge>
      </div>

      <div className="space-y-2 pl-6">
        {projectSignals.projectName && (
          <p className="text-body-sm font-medium">
            {projectSignals.projectName}
          </p>
        )}

        {projectSignals.projectAddress && (
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {projectSignals.projectAddress}
          </div>
        )}

        {projectSignals.generalContractor && (
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span>GC: {projectSignals.generalContractor}</span>
          </div>
        )}

        {projectSignals.engineer && (
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <Pencil className="w-3 h-3" />
            <span>Engineer: {projectSignals.engineer}</span>
          </div>
        )}

        {projectSignals.architect && (
          <div className="flex items-center gap-2 text-micro text-muted-foreground">
            <Pencil className="w-3 h-3" />
            <span>Architect: {projectSignals.architect}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BidDatesSection({
  bidDueDates,
}: {
  bidDueDates: ExtractedData["bidDueDates"];
}) {
  if (bidDueDates.length === 0) {
    return (
      <div>
        <h3 className="text-detail font-semibold mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Bid Due Dates
        </h3>
        <p className="text-micro text-muted-foreground italic">
          No bid due dates identified
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-detail font-semibold mb-2 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Bid Due Dates ({bidDueDates.length})
      </h3>

      <div className="space-y-3 pl-6">
        {bidDueDates.map((bidDate, index) => (
          <div
            key={index}
            className="p-3 bg-muted/50 rounded-md border border-border"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-body-sm font-medium">
                  {formatDate(bidDate.date)}
                </span>
              </div>
              <Badge
                variant={getConfidenceBadgeVariant(bidDate.confidence)}
                className="text-micro"
              >
                {formatConfidence(bidDate.confidence)}
              </Badge>
            </div>

            {bidDate.time && (
              <div className="flex items-center gap-2 text-micro text-muted-foreground ml-6">
                <Clock className="w-3 h-3" />
                {bidDate.time}
                {bidDate.timezone && ` (${bidDate.timezone})`}
              </div>
            )}

            <div className="mt-2 text-micro text-muted-foreground">
              <span
                className={`inline-block px-2 py-0.5 rounded text-micro ${
                  bidDate.source === "explicit"
                    ? "bg-green-500/10 text-green-700"
                    : "bg-yellow-500/10 text-yellow-700"
                }`}
              >
                {bidDate.source}
              </span>
              <span className="ml-2 italic">"{bidDate.rawText}"</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesSection({ notes }: { notes: string[] }) {
  return (
    <div>
      <h3 className="text-detail font-semibold mb-2 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Extraction Notes
      </h3>
      <ul className="space-y-1 pl-6 text-micro text-muted-foreground">
        {notes.map((note, index) => (
          <li key={index} className="list-disc ml-4">
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}
