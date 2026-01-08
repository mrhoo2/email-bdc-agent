"use client";

import { useState } from "react";
import { Mail, Bot, Calendar, Users } from "lucide-react";
import {
  GmailConnectionCard,
  EmailList,
  EmailViewer,
} from "@/components/gmail";
import type { ParsedEmail } from "@/lib/gmail/types";

export default function Home() {
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ParsedEmail | null>(null);

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
            icon={<Bot className="w-6 h-6" />}
            title="AI Provider"
            value="Ready"
            description="GPT-4o configured"
          />
          <StatusCard
            icon={<Users className="w-6 h-6" />}
            title="Projects Identified"
            value="—"
            description="Process emails first"
          />
          <StatusCard
            icon={<Calendar className="w-6 h-6" />}
            title="Upcoming Bids"
            value="—"
            description="No bid dates extracted"
          />
        </div>

        {/* Gmail Connection Card */}
        <div className="mb-8">
          <GmailConnectionCard onConnectionChange={setIsGmailConnected} />
        </div>

        {/* Email List and Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmailList
            isConnected={isGmailConnected}
            onEmailSelect={setSelectedEmail}
          />
          <EmailViewer
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-detail text-muted-foreground">
          <p>BuildVision Labs • Email BDC Agent v0.1.0</p>
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
      <p className="text-micro text-muted-foreground">{description}</p>
    </div>
  );
}
