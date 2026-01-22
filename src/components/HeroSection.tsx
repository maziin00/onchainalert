import StatsCard from "./StatsCard";

const HeroSection = () => {
  return (
    <div className="glass-card-glow p-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
        <div className="flex-1">
          <p className="stat-label text-primary mb-3">Onchain Radar</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
            Auto Alert Built by Maziin00.
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mb-6">
            Sistem otomatis menarik top token CMC, membaca transfer token di Arkham, 
            lalu menghitung akumulasi atau distribusi berdasarkan netflow.
          </p>
          <div className="flex items-center gap-4">
            <span className="badge-status">Menunggu Data</span>
            <span className="text-sm text-muted-foreground">Last Update: -</span>
          </div>
        </div>

        <div className="glass-card bg-secondary/40 p-5 min-w-[200px]">
          <div className="space-y-4">
            <StatsCard label="Top Token" value="100" />
            <StatsCard label="Window" value="1 hari" />
            <StatsCard label="Min. Supply" value="0.001%" />
            <StatsCard label="Auto Refresh" value="5 menit" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
