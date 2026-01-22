import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const AlertList = () => {
  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Alert List</h2>
        <span className="badge-signal">0 Signal</span>
      </div>

      <div className="space-y-4">
        <div className="glass-card bg-secondary/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">Sentiment</h3>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-6 w-6">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="stat-label">Timeframe</p>
              <p className="text-foreground font-medium">-</p>
            </div>
            <div>
              <p className="stat-label">CEX Inflow</p>
              <p className="text-foreground font-mono font-medium">$0</p>
            </div>
            <div>
              <p className="stat-label">CEX Outflow</p>
              <p className="text-foreground font-mono font-medium">$0</p>
            </div>
            <div>
              <p className="stat-label">CEX Net</p>
              <p className="text-foreground font-mono font-medium">$0</p>
            </div>
            <div>
              <p className="stat-label">Akumulasi</p>
              <p className="text-foreground font-mono font-medium">0</p>
            </div>
            <div>
              <p className="stat-label">Distribusi</p>
              <p className="text-foreground font-mono font-medium">0</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Wallet Unik: <span className="text-foreground">0</span> • 
            Smart Money: <span className="text-foreground">0</span> • 
            Market Maker: <span className="text-foreground">0</span>
          </p>

          <p className="stat-label mb-3">Top Movers</p>
        </div>

        <div className="glass-card bg-secondary/20 p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Belum ada alert. Data akan muncul otomatis setelah fetch pertama.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertList;
