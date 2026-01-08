/**
 * Gmail OAuth API Routes
 * GET /api/auth/gmail - Start OAuth flow (redirect to Google)
 * DELETE /api/auth/gmail - Disconnect Gmail (logout)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, clearTokens, getAuthState } from "@/lib/gmail";

/**
 * GET /api/auth/gmail
 * Returns auth state or redirects to Google OAuth
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // If action=connect, redirect to Google OAuth
  if (action === "connect") {
    try {
      const authUrl = getAuthUrl();
      return NextResponse.redirect(authUrl);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate auth URL",
        },
        { status: 500 }
      );
    }
  }

  // Default: return current auth state
  try {
    const authState = await getAuthState();
    return NextResponse.json(authState);
  } catch (error) {
    return NextResponse.json(
      {
        isAuthenticated: false,
        error:
          error instanceof Error ? error.message : "Failed to get auth state",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/gmail
 * Disconnect Gmail (clear tokens)
 */
export async function DELETE() {
  try {
    clearTokens();
    return NextResponse.json({ success: true, message: "Gmail disconnected" });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to disconnect Gmail",
      },
      { status: 500 }
    );
  }
}
