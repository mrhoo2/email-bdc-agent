"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, CheckCircle, XCircle, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GmailAuthState } from "@/lib/gmail/types";

interface GmailConnectionCardProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export function GmailConnectionCard({
  onConnectionChange,
}: GmailConnectionCardProps) {
  const [authState, setAuthState] = useState<GmailAuthState>({
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check authentication status on mount and after OAuth redirect
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/gmail");
      const data = await response.json();
      setAuthState(data);
      onConnectionChange?.(data.isAuthenticated);
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setAuthState({
        isAuthenticated: false,
        error: "Failed to check authentication status",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onConnectionChange]);

  useEffect(() => {
    checkAuthStatus();

    // Check URL params for OAuth callback results
    const urlParams = new URLSearchParams(window.location.search);
    const authResult = urlParams.get("auth");
    const email = urlParams.get("email");
    const message = urlParams.get("message");

    if (authResult === "success" && email) {
      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
      // Refresh auth state
      checkAuthStatus();
    } else if (authResult === "error" && message) {
      setAuthState({
        isAuthenticated: false,
        error: decodeURIComponent(message),
      });
      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [checkAuthStatus]);

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = "/api/auth/gmail?action=connect";
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await fetch("/api/auth/gmail", { method: "DELETE" });
      setAuthState({ isAuthenticated: false });
      onConnectionChange?.(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Gmail Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <CardTitle className="text-h5">Gmail Connection</CardTitle>
          </div>
          <Badge
            variant={authState.isAuthenticated ? "default" : "secondary"}
            className={
              authState.isAuthenticated
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : ""
            }
          >
            {authState.isAuthenticated ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            {authState.isAuthenticated ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <CardDescription>
          {authState.isAuthenticated
            ? `Connected to ${authState.email}`
            : "Connect your Gmail account to start processing bid emails"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authState.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-detail">
            {authState.error}
          </div>
        )}

        {authState.isAuthenticated ? (
          <div className="flex items-center justify-between">
            <div className="text-detail text-muted-foreground">
              {authState.expiresAt && (
                <span>
                  Token expires:{" "}
                  {new Date(authState.expiresAt).toLocaleString()}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect} className="w-full">
            <Mail className="w-4 h-4 mr-2" />
            Connect Gmail Account
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
