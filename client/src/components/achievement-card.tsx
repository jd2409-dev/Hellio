import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

interface AchievementCardProps {
  name: string;
  description: string;
  icon?: string;
  color?: string;
  earned?: boolean;
}

export default function AchievementCard({ 
  name, 
  description, 
  icon = "fas fa-trophy", 
  color = "from-amber-500 to-orange-500",
  earned = true 
}: AchievementCardProps) {
  return (
    <Card className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm transition-all duration-300 ${earned ? 'hover:border-amber-500/30' : 'opacity-60'}`}>
      <CardContent className="p-4 text-center">
        <div className={`w-16 h-16 bg-gradient-to-r ${color} rounded-full flex items-center justify-center mx-auto mb-3 ${earned ? '' : 'grayscale'}`}>
          {icon.startsWith('fas') ? (
            <i className={`${icon} text-2xl text-white`}></i>
          ) : (
            <Award className="h-8 w-8 text-white" />
          )}
        </div>
        <h3 className="text-sm font-bold text-white mb-1">{name}</h3>
        <p className="text-xs text-slate-400 mb-2">{description}</p>
        {earned && (
          <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            Earned
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}