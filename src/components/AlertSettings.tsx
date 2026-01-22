import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

const AlertSettings = () => {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-foreground mb-2">Alert Setting</h2>
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        Data diambil otomatis, untuk mengubah parameter di bawah untuk menentukan jumlah token top CMC, window waktu, dan refresh otomatis.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <label className="stat-label">Top Token (CMC)</label>
          <Input 
            type="text" 
            defaultValue="100" 
            className="input-web3 bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <label className="stat-label">Window (Jam)</label>
          <Input 
            type="text" 
            defaultValue="24" 
            className="input-web3 bg-secondary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <label className="stat-label">Min. Supply (%)</label>
          <Input 
            type="text" 
            defaultValue="0,001" 
            className="input-web3 bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <label className="stat-label">Timeframe (Signal)</label>
          <Select defaultValue="1-minggu">
            <SelectTrigger className="input-web3 bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-minggu">1 Minggu</SelectItem>
              <SelectItem value="1-hari">1 Hari</SelectItem>
              <SelectItem value="1-bulan">1 Bulan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="stat-label">Auto Refresh (Menit)</label>
          <Input 
            type="text" 
            defaultValue="5" 
            className="input-web3 bg-secondary/50"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6">
          Ambil Alert
        </Button>
        <Button variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
          Stop
        </Button>
        <Button variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
          Bersihkan
        </Button>
      </div>

      <div className="glass-card bg-secondary/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">Signal Buy/Sell</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Harga dihitung dari CMC (estimasi 5%-10%).
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertSettings;
