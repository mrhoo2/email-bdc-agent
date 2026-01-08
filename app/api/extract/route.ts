/**
 * Entity Extraction API Route
 * 
 * POST /api/extract - Extract entities from an email using Gemini 3 Pro
 */

import { NextRequest, NextResponse } from "next/server";
import { extractEntitiesFromRaw } from "@/lib/extraction";
import { ExtractionRequestSchema } from "@/lib/extraction/schemas";
import { fetchEmailById, getValidTokens } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const parseResult = ExtractionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { emailId, emailData } = parseResult.data;

    // If email data provided directly, use it
    if (emailData) {
      const result = await extractEntitiesFromRaw({
        id: emailId,
        ...emailData,
      });

      return NextResponse.json(result);
    }

    // Otherwise, fetch from Gmail
    const tokens = await getValidTokens();

    if (!tokens) {
      return NextResponse.json(
        {
          success: false,
          error: "Gmail not authenticated. Please connect Gmail first.",
        },
        { status: 401 }
      );
    }

    // Fetch the specific email
    const email = await fetchEmailById(emailId);

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: `Email with ID ${emailId} not found`,
        },
        { status: 404 }
      );
    }

    // Extract entities
    const result = await extractEntitiesFromRaw({
      id: email.id,
      threadId: email.threadId,
      from: email.from,
      to: email.to,
      cc: email.cc,
      subject: email.subject,
      body: email.body,
      date: email.date.toISOString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extraction API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/extract?emailId=xxx - Get extraction status or existing extraction
 * For now, returns 501 Not Implemented (caching will be added later)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailId = searchParams.get("emailId");

  if (!emailId) {
    return NextResponse.json(
      {
        success: false,
        error: "emailId parameter required",
      },
      { status: 400 }
    );
  }

  // TODO: Implement extraction caching/persistence
  return NextResponse.json(
    {
      success: false,
      error: "Extraction caching not yet implemented. Use POST to extract.",
    },
    { status: 501 }
  );
}
