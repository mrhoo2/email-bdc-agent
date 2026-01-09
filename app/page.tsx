"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { Header } from "@/components/layout";
import { EmailPanel, GmailConnectionCard } from "@/components/gmail";
import { BidList, BidCalendar } from "@/components/bids";
import { createGroupedBidList, type GroupedBidList, type ProcessingState, INITIAL_PROCESSING_STATE, type BidItem } from "@/lib/bids";
import type { ParsedEmail } from "@/lib/gmail/types";
import type { ExtractedData } from "@/lib/extraction/schemas";
import type { ClusteringResult } from "@/lib/clustering/types";

export default function Home() {
  // Connection state
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // Data state
  const [emails, setEmails] = useState<ParsedEmail[]>([]);
  const [extractions, setExtractions] = useState<ExtractedData[]>([]);
  const [bidList, setBidList] = useState<GroupedBidList | null>(null);

  // Processing state
  const [processing, setProcessing] = useState<ProcessingState>(INITIAL_PROCESSING_STATE);

  // UI state
  const [highlightEmailId, setHighlightEmailId] = useState<string | null>(null);
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const [highlightDate, setHighlightDate] = useState<Date | null>(null);

  // Ref to track if processing is cancelled
  const processingCancelled = useRef(false);
  // Ref to calendar panel for collapse/expand
  const calendarPanelRef = useRef<any>(null);

  /**
   * Check Gmail connection status on mount
   */
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/auth/gmail");
        const data = await response.json();
        setIsGmailConnected(data.isAuthenticated === true);
        if (data.email) {
          setConnectedEmail(data.email);
        }
      } catch (error) {
        console.error("Failed to check Gmail connection:", error);
      }
    };
    checkConnection();
  }, []);

  /**
   * Handle Gmail connection change
   */
  const handleConnectionChange = useCallback((connected: boolean, email?: string) => {
    setIsGmailConnected(connected);
    if (email) {
      setConnectedEmail(email);
    }
    if (connected) {
      setShowConnectionModal(false);
    }
  }, []);

  /**
   * Disconnect Gmail
   */
  const handleDisconnect = useCallback(async () => {
    try {
      await fetch("/api/auth/gmail", { method: "DELETE" });
      setIsGmailConnected(false);
      setConnectedEmail(null);
      setEmails([]);
      setExtractions([]);
      setBidList(null);
    } catch (error) {
      console.error("Failed to disconnect Gmail:", error);
    }
  }, []);

  /**
   * Handle emails loaded from EmailPanel
   */
  const handleEmailsLoaded = useCallback((loadedEmails: ParsedEmail[]) => {
    setEmails(loadedEmails);
  }, []);

  /**
   * Process a single email
   */
  const handleProcessSingleEmail = useCallback(async (email: ParsedEmail) => {
    setProcessing({
      stage: "extracting",
      progress: 50,
      message: `Extracting: ${email.subject}`,
      emailsFetched: 1,
      emailsExtracted: 0,
      bidsCreated: 0,
    });

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          emailData: {
            from: email.from,
            to: email.to,
            cc: email.cc,
            subject: email.subject,
            body: email.body,
            date: email.date,
            threadId: email.threadId,
          },
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setExtractions((prev) => {
          const filtered = prev.filter((e) => e.emailId !== email.id);
          return [...filtered, result.data];
        });

        setExtractions((prev) => {
          const groupedBidList = createGroupedBidList(prev, emails);
          setBidList(groupedBidList);
          return prev;
        });
      }

      setProcessing({
        stage: "complete",
        progress: 100,
        message: "Extraction complete!",
        emailsFetched: 1,
        emailsExtracted: 1,
        bidsCreated: 1,
      });

      setTimeout(() => {
        setProcessing(INITIAL_PROCESSING_STATE);
      }, 1500);
    } catch (error) {
      setProcessing({
        ...INITIAL_PROCESSING_STATE,
        stage: "error",
        error: error instanceof Error ? error.message : "Extraction failed",
      });
    }
  }, [emails]);

  /**
   * Process emails in batches with concurrent LLM calls (max 15)
   */
  const processEmailBatch = useCallback(
    async (
      emailBatch: ParsedEmail[],
      onProgress: (completed: number) => void
    ): Promise<ExtractedData[]> => {
      const MAX_CONCURRENT = 15;
      const results: ExtractedData[] = [];
      let completed = 0;

      for (let i = 0; i < emailBatch.length; i += MAX_CONCURRENT) {
        if (processingCancelled.current) break;

        const chunk = emailBatch.slice(i, i + MAX_CONCURRENT);
        
        const chunkResults = await Promise.allSettled(
          chunk.map(async (email) => {
            const response = await fetch("/api/extract", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                emailId: email.id,
                emailData: {
                  from: email.from,
                  to: email.to,
                  cc: email.cc,
                  subject: email.subject,
                  body: email.body,
                  date: email.date,
                  threadId: email.threadId,
                },
              }),
            });
            const result = await response.json();
            return result.success && result.data ? result.data : null;
          })
        );

        for (const result of chunkResults) {
          if (result.status === "fulfilled" && result.value) {
            results.push(result.value);
          }
          completed++;
          onProgress(completed);
        }
      }

      return results;
    },
    []
  );

  /**
   * Process all emails: Extract → Cluster → Display
   */
  const handleProcessEmails = useCallback(async () => {
    if (emails.length === 0) return;

    processingCancelled.current = false;
    setProcessing({
      stage: "extracting",
      progress: 0,
      message: "Extracting entities from emails (15 concurrent)...",
      emailsFetched: emails.length,
      emailsExtracted: 0,
      bidsCreated: 0,
    });

    try {
      const extractedData = await processEmailBatch(emails, (completed) => {
        setProcessing((prev) => ({
          ...prev,
          progress: Math.round((completed / emails.length) * 50),
          message: `Extracting email ${completed} of ${emails.length}...`,
          emailsExtracted: completed,
        }));
      });

      if (processingCancelled.current) {
        setProcessing(INITIAL_PROCESSING_STATE);
        return;
      }

      setExtractions(extractedData);

      setProcessing((prev) => ({
        ...prev,
        stage: "clustering",
        progress: 60,
        message: "Clustering emails by project...",
        emailsExtracted: extractedData.length,
      }));

      let clusters: ClusteringResult["clusters"] = [];
      try {
        const clusterResponse = await fetch("/api/cluster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails: extractedData.map((ext) => {
              const email = emails.find((e) => e.id === ext.emailId);
              return {
                emailId: ext.emailId,
                threadId: email?.threadId || "",
                subject: email?.subject || "",
                from: email?.from.email || "",
                date: email?.date || "",
                projectName: ext.projectSignals?.projectName || null,
                projectAddress: ext.projectSignals?.projectAddress || null,
                generalContractor: ext.projectSignals?.generalContractor || null,
                engineer: ext.projectSignals?.engineer || null,
                architect: ext.projectSignals?.architect || null,
                purchaserCompany: ext.purchaser?.companyName || null,
              };
            }),
            config: { useAI: false },
          }),
        });

        const clusterResult = await clusterResponse.json();
        if (clusterResult.success) {
          clusters = clusterResult.data.clusters;
        }
      } catch (error) {
        console.error("Clustering failed:", error);
      }

      setProcessing((prev) => ({
        ...prev,
        progress: 90,
        message: "Generating bid list...",
      }));

      const groupedBidList = createGroupedBidList(extractedData, emails, clusters);
      setBidList(groupedBidList);

      setProcessing({
        stage: "complete",
        progress: 100,
        message: "Processing complete!",
        emailsFetched: emails.length,
        emailsExtracted: extractedData.length,
        bidsCreated: groupedBidList.summary.totalBids,
      });

      setTimeout(() => {
        setProcessing((prev) => ({
          ...prev,
          stage: "idle",
        }));
      }, 2000);
    } catch (error) {
      setProcessing({
        ...INITIAL_PROCESSING_STATE,
        stage: "error",
        error: error instanceof Error ? error.message : "Processing failed",
      });
    }
  }, [emails, processEmailBatch]);

  /**
   * Download bid list as JSON
   */
  const handleDownloadJSON = useCallback(() => {
    if (!bidList) return;
    
    const dataStr = JSON.stringify(bidList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bids-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [bidList]);

  /**
   * Handle email click from bid card
   */
  const handleEmailClick = useCallback((emailId: string) => {
    setHighlightEmailId(emailId);
  }, []);

  /**
   * Handle calendar day click - scroll to bids for that date
   */
  const handleCalendarDayClick = useCallback((date: Date) => {
    setHighlightDate(date);
    // Clear highlight after animation
    setTimeout(() => setHighlightDate(null), 2000);
  }, []);

  /**
   * Toggle calendar collapse
   */
  const handleToggleCalendar = useCallback(() => {
    setCalendarCollapsed((prev) => !prev);
    // Use panel API to collapse/expand if available
    if (calendarPanelRef.current) {
      if (calendarCollapsed) {
        calendarPanelRef.current.expand();
      } else {
        calendarPanelRef.current.collapse();
      }
    }
  }, [calendarCollapsed]);

  // Get all bids as flat array for calendar
  const allBids: BidItem[] = bidList?.groups.flatMap(g => g.bids) ?? [];

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <Header
        onDownloadJSON={handleDownloadJSON}
        isProcessing={processing.stage === "extracting" || processing.stage === "clustering"}
        emailCount={emails.length}
        bidCount={bidList?.summary.totalBids ?? 0}
        connectedEmail={connectedEmail}
        onDisconnect={handleDisconnect}
        onConnect={() => setShowConnectionModal(true)}
        isConnected={isGmailConnected}
        canDownload={bidList !== null && (bidList?.summary.totalBids ?? 0) > 0}
      />

      {/* Processing Banner */}
      {(processing.stage === "extracting" || processing.stage === "clustering") && (
        <div className="bg-bv-blue-50 border-b border-bv-blue-200 px-6 py-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-bv-blue-700">
                {processing.message}
              </div>
              <div className="w-full bg-bv-blue-200 rounded-full h-1.5 mt-1">
                <div
                  className="bg-bv-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${processing.progress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => {
                processingCancelled.current = true;
              }}
              className="text-xs text-bv-blue-600 hover:text-bv-blue-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content: 3-Panel Resizable Layout */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Group orientation="horizontal" className="h-full">
          {/* Left Panel: Email List + Viewer */}
          <Panel 
            id="email-panel"
            defaultSize={25} 
            minSize={15} 
            maxSize={40}
            className="h-full"
          >
            <EmailPanel
              isConnected={isGmailConnected}
              onConnectionRequired={() => setShowConnectionModal(true)}
              onEmailsLoaded={handleEmailsLoaded}
              highlightEmailId={highlightEmailId}
              onProcessEmail={handleProcessSingleEmail}
              onProcessAll={handleProcessEmails}
              isProcessing={processing.stage === "extracting" || processing.stage === "clustering"}
            />
          </Panel>

          {/* Resize Handle */}
          <Separator className="w-1.5 bg-neutral-200 hover:bg-bv-blue-400 transition-colors cursor-col-resize" />

          {/* Middle Panel: Bid List */}
          <Panel 
            id="bid-panel"
            defaultSize={50} 
            minSize={30}
            className="h-full"
          >
            <div className="h-full bg-neutral-100">
              <BidList
                bidList={bidList}
                onEmailClick={handleEmailClick}
                isLoading={processing.stage === "extracting" || processing.stage === "clustering"}
              />
            </div>
          </Panel>

          {/* Resize Handle */}
          <Separator className="w-1.5 bg-neutral-200 hover:bg-bv-blue-400 transition-colors cursor-col-resize" />

          {/* Right Panel: Calendar (Collapsible) */}
          <Panel 
            id="calendar-panel"
            panelRef={calendarPanelRef}
            defaultSize={25} 
            minSize={calendarCollapsed ? 3 : 15}
            maxSize={35}
            collapsible
            collapsedSize={3}
            onResize={(size) => {
              const numSize = typeof size === 'number' ? size : parseFloat(String(size));
              if (numSize <= 3) setCalendarCollapsed(true);
              else setCalendarCollapsed(false);
            }}
            className="h-full"
          >
            <BidCalendar
              bids={allBids}
              onDayClick={handleCalendarDayClick}
              isCollapsed={calendarCollapsed}
              onToggleCollapse={handleToggleCalendar}
            />
          </Panel>
        </Group>
      </div>

      {/* Gmail Connection Modal Overlay */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <GmailConnectionCard
              onConnectionChange={(connected) => {
                handleConnectionChange(connected);
              }}
            />
            <button
              onClick={() => setShowConnectionModal(false)}
              className="mt-4 w-full text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
