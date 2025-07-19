import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SubjectCardProps {
  subject: {
    id: number;
    name: string;
    description: string;
    icon?: string;
    color?: string;
  };
  progress: number;
}

export default function SubjectCard({ subject, progress }: SubjectCardProps) {
  const iconClass = subject.icon || 'fas fa-book';
  const iconColor = subject.color || '#50C878';

  return (
    <Link href={`/subject/${subject.id}`}>
      <Card className="glass-effect hover:neon-border transition-all duration-300 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold group-hover:text-nexus-green transition-colors">
              {subject.name}
            </h3>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${iconColor}, #50C878)` }}
            >
              <i className={`${iconClass} text-white`}></i>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">{subject.description}</p>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span className="text-nexus-green">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <p className="text-gray-400 text-sm">
            Next: {getNextTopic(subject.name)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function getNextTopic(subjectName: string): string {
  const topics: { [key: string]: string } = {
    'Mathematics': 'Calculus Integration',
    'Physics': 'Electromagnetic Waves',
    'Chemistry': 'Organic Reactions',
    'Biology': 'Cell Division',
    'English': 'Essay Writing',
    'History': 'World War I'
  };
  
  return topics[subjectName] || 'Next Module';
}
