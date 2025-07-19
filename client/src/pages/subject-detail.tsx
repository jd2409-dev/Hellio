import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function SubjectDetail() {
  const [, params] = useRoute("/subject/:id");
  const subjectId = params?.id;

  // Mock data for demonstration
  const subjectData = {
    1: {
      name: 'Mathematics',
      description: 'Advanced Calculus & Algebra',
      progress: 85,
      studyTime: 24.5,
      quizAverage: 92,
      modules: [
        {
          id: 1,
          name: 'Differential Calculus',
          description: 'Limits, derivatives, and applications',
          status: 'completed',
          duration: '2 hours',
          icon: 'fas fa-play',
          color: 'from-nexus-green to-blue-500'
        },
        {
          id: 2,
          name: 'Integration Techniques',
          description: 'Integration by parts, substitution',
          status: 'in-progress',
          progress: 65,
          icon: 'fas fa-clock',
          color: 'from-nexus-gold to-orange-500'
        },
        {
          id: 3,
          name: 'Multivariable Calculus',
          description: 'Partial derivatives, multiple integrals',
          status: 'locked',
          icon: 'fas fa-lock',
          color: 'from-gray-500 to-gray-600'
        }
      ]
    }
  };

  const subject = subjectData[1]; // Default to Mathematics for demo

  if (!subject) {
    return (
      <div className="min-h-screen bg-nexus-black text-white flex items-center justify-center">
        <Card className="glass-effect">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Subject Not Found</h2>
            <Link href="/">
              <Button className="bg-nexus-green text-black hover:bg-nexus-gold">
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-black text-white">
      {/* Header */}
      <div className="glass-effect p-6 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </Button>
              </Link>
              <h2 className="font-orbitron text-3xl font-bold text-nexus-green">{subject.name}</h2>
            </div>
            <p className="text-gray-400">{subject.description}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Progress value={subject.progress} className="h-3" />
                </div>
                <span className="text-nexus-green font-bold">{subject.progress}%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Study Time</h3>
              <div className="text-3xl font-bold text-nexus-green">{subject.studyTime}h</div>
              <p className="text-gray-400">This month</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Quiz Average</h3>
              <div className="text-3xl font-bold text-nexus-gold">{subject.quizAverage}%</div>
              <p className="text-gray-400">Last 10 quizzes</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Learning Modules */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6">Learning Modules</h3>
          <div className="space-y-4">
            {subject.modules.map((module) => (
              <Card key={module.id} className="glass-effect hover:neon-border transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${module.color} rounded-lg flex items-center justify-center`}>
                        <i className={`${module.icon} text-white`}></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold">{module.name}</h4>
                        <p className="text-gray-400">{module.description}</p>
                        {module.status === 'in-progress' && module.progress && (
                          <div className="mt-2">
                            <Progress value={module.progress} className="h-2 w-32" />
                            <span className="text-xs text-gray-500">{module.progress}% complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {module.status === 'completed' && (
                        <>
                          <div className="text-nexus-green font-semibold">Completed</div>
                          <div className="text-sm text-gray-400">{module.duration}</div>
                        </>
                      )}
                      {module.status === 'in-progress' && (
                        <>
                          <div className="text-nexus-gold font-semibold">In Progress</div>
                          <div className="text-sm text-gray-400">{module.progress}% complete</div>
                        </>
                      )}
                      {module.status === 'locked' && (
                        <>
                          <div className="text-gray-400 font-semibold">Locked</div>
                          <div className="text-sm text-gray-500">Complete previous modules</div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/ai-tutor">
            <Button className="bg-nexus-green text-black hover:bg-nexus-gold">
              <i className="fas fa-robot mr-2"></i>
              Ask AI Tutor
            </Button>
          </Link>
          <Link href="/quiz-selection">
            <Button className="bg-purple-500 hover:bg-purple-600">
              <i className="fas fa-question-circle mr-2"></i>
              Take Quiz
            </Button>
          </Link>
          <Link href="/textbook-upload">
            <Button className="bg-nexus-gold text-black hover:bg-nexus-green">
              <i className="fas fa-upload mr-2"></i>
              Upload Materials
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
