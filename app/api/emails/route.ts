/**
 * Email Fetching API Routes
 * GET /api/emails - Fetch emails from Gmail
 */

import { NextRequest, NextResponse } from "next/server";
import {
  fetchEmails,
  fetchEmailById,
  fetchAllEmails,
  getLabels,
  getStoredTokens,
} from "@/lib/gmail";

/**
 * GET /api/emails
 * Fetch emails from Gmail with optional filtering
 *
 * Query parameters:
 * - maxResults: number (default: 50, max: 100)
 * - pageToken: string (for pagination)
 * - query: string (Gmail search query)
 * - labelIds: string (comma-separated label IDs)
 * - id: string (fetch single email by ID)
 * - all: boolean (fetch all emails, use with maxTotal)
 * - maxTotal: number (max emails when using all=true, default: 500)
 * - labels: boolean (return labels list instead of emails)
 */
export async function GET(request: NextRequest) {
  // Check if authenticated
  const tokens = getStoredTokens();
  if (!tokens) {
    return NextResponse.json(
      {
        error: "Not authenticated",
        message: "Please connect your Gmail account first",
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  try {
    // Fetch labels list
    if (searchParams.get("labels") === "true") {
      const labels = await getLabels();
      return NextResponse.json({ success: true, labels });
    }

    // Fetch single email by ID
    const emailId = searchParams.get("id");
    if (emailId) {
      const email = await fetchEmailById(emailId);
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Email not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, email });
    }

    // Fetch all emails (for backfill)
    if (searchParams.get("all") === "true") {
      const maxTotal = Math.min(
        parseInt(searchParams.get("maxTotal") || "500", 10),
        2000 // Hard limit
      );
      const query = searchParams.get("query") || undefined;
      const labelIds = searchParams.get("labelIds")?.split(",").filter(Boolean);

      const emails = await fetchAllEmails({
        maxTotal,
        query,
        labelIds,
        maxResults: 50, // Batch size
      });

      return NextResponse.json({
        success: true,
        emails,
        total: emails.length,
      });
    }

    // Standard paginated fetch
    const maxResults = Math.min(
      parseInt(searchParams.get("maxResults") || "50", 10),
      100
    );
    const pageToken = searchParams.get("pageToken") || undefined;
    const query = searchParams.get("query") || undefined;
    const labelIds = searchParams.get("labelIds")?.split(",").filter(Boolean);

    const result = await fetchEmails({
      maxResults,
      pageToken,
      query,
      labelIds,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error fetching emails:", error);

    // Check for auth errors
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("invalid_grant") ||
        error.message.includes("Token has been expired"))
    ) {
      return NextResponse.json(
        {
          error: "Authentication expired",
          message: "Please reconnect your Gmail account",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch emails",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
