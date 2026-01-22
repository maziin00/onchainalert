import HeroSection from "@/components/HeroSection";
import AlertSettings from "@/components/AlertSettings";
import AlertList from "@/components/AlertList";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-glow-secondary/5 pointer-events-none" />
      
      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
              </div>
              <span className="font-semibold text-foreground">OnChain Radar</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">v1.0.0</span>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          <HeroSection />
          
          <div className="grid lg:grid-cols-2 gap-6">
            <AlertSettings />
            <AlertList />
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Built with 💎 by Maziin00</p>
            <p>Powered by CMC & Arkham</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
