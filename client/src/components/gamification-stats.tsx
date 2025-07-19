interface GamificationStatsProps {
  xp: number;
  coins: number;
  level: number;
}

export default function GamificationStats({ xp, coins, level }: GamificationStatsProps) {
  return (
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-2 bg-nexus-gray px-4 py-2 rounded-lg">
        <i className="fas fa-star text-nexus-gold"></i>
        <span className="font-medium">{xp.toLocaleString()} XP</span>
      </div>
      
      <div className="flex items-center space-x-2 bg-nexus-gray px-4 py-2 rounded-lg">
        <i className="fas fa-coins text-nexus-gold"></i>
        <span className="font-medium">{coins.toLocaleString()}</span>
      </div>
      
      <div className="flex items-center space-x-2 bg-nexus-gray px-4 py-2 rounded-lg">
        <span className="text-gray-300">Level</span>
        <span className="text-nexus-green font-bold text-lg">{level}</span>
      </div>
    </div>
  );
}
