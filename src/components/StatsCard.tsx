interface StatsCardProps {
  label: string;
  value: string;
}

const StatsCard = ({ label, value }: StatsCardProps) => {
  return (
    <div className="space-y-1">
      <p className="stat-label">{label}</p>
      <p className="stat-value font-mono">{value}</p>
    </div>
  );
};

export default StatsCard;
