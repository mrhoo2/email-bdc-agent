/**
 * Gmail OAuth Callback Route
 * GET /api/auth/gmail/callback - Handle OAuth redirect from Google
 */

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getGmailProfile } from "@/lib/gmail";

/**
 * GET /api/auth/gmail/callback
 * Handle the OAuth callback from Google
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Get the app URL for redirects
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      `${appUrl}?auth=error&message=${encodeURIComponent(error)}`
    );
  }

  // Verify we have an authorization code
  if (!code) {
    console.error("No authorization code received");
    return NextResponse.redirect(
      `${appUrl}?auth=error&message=${encodeURIComponent("No authorization code received")}`
    );
  }

  try {
    // Exchange the code for tokens
    await exchangeCodeForTokens(code);

    // Get the user's email to confirm authentication
    const profile = await getGmailProfile();

    console.log(`Successfully authenticated Gmail for: ${profile.emailAddress}`);

    // Redirect back to the app with success
    return NextResponse.redirect(
      `${appUrl}?auth=success&email=${encodeURIComponent(profile.emailAddress)}`
    );
  } catch (err) {
    console.error("Failed to exchange code for tokens:", err);

    const errorMessage =
      err instanceof Error ? err.message : "Authentication failed";

    return NextResponse.redirect(
      `${appUrl}?auth=error&message=${encodeURIComponent(errorMessage)}`
    );
  }
}
