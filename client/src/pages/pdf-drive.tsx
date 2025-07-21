import { Link } from 'wouter';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import PdfDriveSearch from '@/components/pdf-drive-search';

export default function PdfDrivePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-nexus-black text-nexus-light">
      {/* Header */}
      <div className="border-b border-nexus-green/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button 
                  variant="default" 
                  className="bg-nexus-green hover:bg-nexus-green/90 text-white font-semibold"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-nexus-green/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-nexus-green" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-nexus-green">Archive.org Book Search</h1>
                  <p className="text-muted-foreground">
                    Access millions of free educational books and resources
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <PdfDriveSearch />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          Created by JD Vinod
        </footer>
      </div>
    </div>
  );
}