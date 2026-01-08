import { Mail, Bot, Calendar, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-h4 font-bold text-foreground mb-2">
            Email BDC Agent
          </h1>
          <p className="text-body-md text-muted-foreground">
            Automated bid desk coordination from your email inbox
          </p>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatusCard
            icon={<Mail className="w-6 h-6" />}
            title="Emails Processed"
            value="—"
            description="Connect Gmail to start"
          />
          <StatusCard
            icon={<Bot className="w-6 h-6" />}
            title="AI Provider"
            value="Not configured"
            description="Add API keys to .env.local"
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

        {/* Main Content Area */}
        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-h5 font-bold mb-4">Getting Started</h2>
          <div className="space-y-4 text-body-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-micro font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-foreground">Configure Environment</p>
                <p>Add your API keys to <code className="bg-muted px-1 rounded">.env.local</code></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-micro font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-foreground">Connect Gmail</p>
                <p>Authorize access to your bids inbox</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-micro font-bold">
                3
              </span>
              <div>
                <p className="font-medium text-foreground">Process Emails</p>
                <p>Extract bid information and generate bid list</p>
              </div>
            </div>
          </div>
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
}

function StatusCard({ icon, title, value, description }: StatusCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-primary">{icon}</div>
        <span className="text-detail font-medium text-muted-foreground">{title}</span>
      </div>
      <p className="text-h5 font-bold text-foreground mb-1">{value}</p>
      <p className="text-micro text-muted-foreground">{description}</p>
    </div>
  );
}
