import { Card, CardContent } from "@/components/ui/card";

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function AchievementCard({ name, description, icon, color }: AchievementCardProps) {
  return (
    <Card className="glass-effect">
      <CardContent className="p-4 text-center">
        <div className={`w-16 h-16 bg-gradient-to-r ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
          <i className={`${icon} text-2xl text-white`}></i>
        </div>
        <h4 className="font-semibold mb-1">{name}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
