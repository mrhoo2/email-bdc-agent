"use client";

import { Download, Loader2, Mail, LogOut, User } from "lucide-react";

interface HeaderProps {
  onDownloadJSON?: () => void;
  isProcessing?: boolean;
  emailCount?: number;
  bidCount?: number;
  connectedEmail?: string | null;
  isConnected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  canDownload?: boolean;
}

export default function Header({
  onDownloadJSON,
  isProcessing = false,
  emailCount = 0,
  bidCount = 0,
  connectedEmail,
  isConnected = false,
  onConnect,
  onDisconnect,
  canDownload = false,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200 flex-shrink-0">
      {/* Left: Logo and title */}
      <div className="flex items-center gap-4">
        <img
          src="https://cdn.prod.website-files.com/66ed6fd402241302f1dafb02/66ed703fbaacce97115809fd_logo-full-color.png"
          alt="BuildVision"
          className="h-7 w-auto"
        />
        <div className="h-6 w-px bg-neutral-200" />
        <h1 className="text-lg font-semibold text-neutral-800">Email BDC Agent</h1>
      </div>

      {/* Center: Stats + Connected Account */}
      <div className="flex items-center gap-6 text-sm text-neutral-600">
        {isConnected && connectedEmail && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
            <User className="h-3.5 w-3.5 text-green-600" />
            <span className="text-green-700 text-xs font-medium">{connectedEmail}</span>
            {onDisconnect && (
              <button
                onClick={onDisconnect}
                className="ml-1 p-0.5 hover:bg-green-100 rounded text-green-600 hover:text-green-800"
                title="Disconnect Gmail"
              >
                <LogOut className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        {!isConnected && onConnect && (
          <button
            onClick={onConnect}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-200 text-yellow-700 text-xs font-medium hover:bg-yellow-100"
          >
            <Mail className="h-3.5 w-3.5" />
            Connect Gmail
          </button>
        )}
        {emailCount > 0 && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{emailCount} emails</span>
          </div>
        )}
        {bidCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-bv-blue-400">{bidCount} bids</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Download JSON Button */}
        {onDownloadJSON && (
          <button
            onClick={onDownloadJSON}
            disabled={!canDownload || isProcessing}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-bv-blue-400 h-9 rounded-md px-4 gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download JSON
          </button>
        )}
      </div>
    </header>
  );
}
