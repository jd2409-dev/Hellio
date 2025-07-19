import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

interface SubjectCardProps {
  subject: {
    id: number;
    name: string;
    description: string;
    icon?: string;
    color?: string;
    progress?: number;
  };
  progress?: number;
}

export default function SubjectCard({ subject, progress }: SubjectCardProps) {
  const subjectProgress = progress || subject.progress || 0;
  
  return (
    <Link href={`/subject/${subject.id}`}>
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/30 cursor-pointer hover:scale-105 transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${subject.color || '#10B981'}20` }}
              >
                <i 
                  className={`${subject.icon || 'fas fa-book'} text-xl`}
                  style={{ color: subject.color || '#10B981' }}
                ></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{subject.name}</h3>
                <p className="text-sm text-slate-400">{subject.description}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm font-semibold text-white">{subjectProgress}%</span>
            </div>
            <Progress 
              value={subjectProgress} 
              className="h-2 bg-slate-700"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}