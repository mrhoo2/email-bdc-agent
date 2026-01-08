"use client";

import { useState } from "react";
import { Mail, Bot, Calendar, Users, Sparkles } from "lucide-react";
import {
  GmailConnectionCard,
  EmailList,
  EmailViewer,
} from "@/components/gmail";
import { ExtractionCard } from "@/components/extraction";
import type { ParsedEmail } from "@/lib/gmail/types";
import type { ExtractedData } from "@/lib/extraction/schemas";

export default function Home() {
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ParsedEmail | null>(null);
  const [extractionCount, setExtractionCount] = useState(0);
  const [latestExtraction, setLatestExtraction] = useState<ExtractedData | null>(null);

  const handleExtractionComplete = (data: ExtractedData) => {
    setExtractionCount((prev) => prev + 1);
    setLatestExtraction(data);
  };

  // Count bid dates from latest extraction
  const bidDateCount = latestExtraction?.bidDueDates?.length ?? 0;
  
  // Get project count from extraction
  const hasProject = latestExtraction?.projectSignals?.projectName ? 1 : 0;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-h4 font-bold text-foreground mb-2">
            Email BDC Agent
          </h1>
          <p className="text-body-md text-muted-foreground">
            Automated bid desk coordination from your email inbox
          </p>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            icon={<Mail className="w-6 h-6" />}
            title="Gmail Status"
            value={isGmailConnected ? "Connected" : "Not Connected"}
            description={
              isGmailConnected ? "Ready to fetch emails" : "Connect to start"
            }
            variant={isGmailConnected ? "success" : "default"}
          />
          <StatusCard
            icon={<Sparkles className="w-6 h-6" />}
            title="AI Provider"
            value="Gemini 3 Pro Preview"
            description={extractionCount > 0 ? `${extractionCount} extractions` : "Ready to extract"}
            variant="success"
          />
          <StatusCard
            icon={<Users className="w-6 h-6" />}
            title="Projects Identified"
            value={hasProject > 0 ? `${hasProject}` : "—"}
            description={hasProject > 0 ? latestExtraction?.projectSignals?.projectName || "Project found" : "Process emails first"}
            variant={hasProject > 0 ? "success" : "default"}
          />
          <StatusCard
            icon={<Calendar className="w-6 h-6" />}
            title="Bid Dates Found"
            value={bidDateCount > 0 ? `${bidDateCount}` : "—"}
            description={bidDateCount > 0 ? "From latest extraction" : "No bid dates extracted"}
            variant={bidDateCount > 0 ? "warning" : "default"}
          />
        </div>

        {/* Gmail Connection Card */}
        <div className="mb-8">
          <GmailConnectionCard onConnectionChange={setIsGmailConnected} />
        </div>

        {/* Main Content: Email List, Viewer, and Extraction */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <EmailList
              isConnected={isGmailConnected}
              onEmailSelect={setSelectedEmail}
            />
          </div>

          {/* Email Viewer */}
          <div className="lg:col-span-1">
            <EmailViewer
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
            />
          </div>

          {/* Entity Extraction */}
          <div className="lg:col-span-1">
            <ExtractionCard
              email={selectedEmail}
              onExtractionComplete={handleExtractionComplete}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-detail text-muted-foreground">
          <p>BuildVision Labs • Email BDC Agent v0.2.0</p>
          <p className="text-micro mt-1">Stage 2: Entity Extraction with Gemini 3 Pro</p>
        </footer>
      </div>
    </main>
  );
}

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  variant?: "default" | "success" | "warning" | "error";
}

function StatusCard({
  icon,
  title,
  value,
  description,
  variant = "default",
}: StatusCardProps) {
  const variantStyles = {
    default: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={variantStyles[variant]}>{icon}</div>
        <span className="text-detail font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <p className="text-h5 font-bold text-foreground mb-1">{value}</p>
      <p className="text-micro text-muted-foreground truncate">{description}</p>
    </div>
  );
}
