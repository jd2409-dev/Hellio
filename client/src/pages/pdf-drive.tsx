import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, BookOpen, Library, Search, Download, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PdfDriveSearch from '@/components/pdf-drive-search';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export default function PdfDrivePage() {
  const { user } = useAuth();
  
  // Fetch user's saved library
  const { data: savedBooks = [] } = useQuery({
    queryKey: ['/api/pdf-drive/library'],
    enabled: !!user,
  });

  // Fetch reading statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/pdf-drive/stats'],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-nexus-black text-nexus-light">
      {/* Header */}
      <div className="border-b border-nexus-green/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className="text-nexus-green hover:bg-nexus-green/10"
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
                  <h1 className="text-2xl font-bold text-nexus-green">PDF Drive Library</h1>
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
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Books
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              My Library ({savedBooks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <PdfDriveSearch />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            {/* Library Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-effect border-nexus-green/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-nexus-green" />
                    <span className="text-2xl font-bold text-nexus-green">
                      {savedBooks.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-nexus-green/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Currently Reading</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-nexus-gold" />
                    <span className="text-2xl font-bold text-nexus-green">
                      {savedBooks.filter((book: any) => book.status === 'reading').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-nexus-green/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-nexus-blue" />
                    <span className="text-2xl font-bold text-nexus-green">
                      {savedBooks.filter((book: any) => book.status === 'completed').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-nexus-green/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Downloaded</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-nexus-green" />
                    <span className="text-2xl font-bold text-nexus-green">
                      {savedBooks.filter((book: any) => book.status === 'downloaded').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Saved Books */}
            {savedBooks.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-nexus-green">Your Saved Books</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedBooks.map((savedBook: any) => (
                    <Card key={savedBook.id} className="glass-effect border-nexus-green/20">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Book Info */}
                          <div className="flex gap-3">
                            <div className="w-16 h-20 bg-nexus-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              {savedBook.book.imageUrl ? (
                                <img 
                                  src={savedBook.book.imageUrl} 
                                  alt={savedBook.book.title}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <BookOpen className="w-8 h-8 text-nexus-green" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-nexus-green text-sm line-clamp-2 mb-1">
                                {savedBook.book.title}
                              </h3>
                              {savedBook.book.author && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  by {savedBook.book.author}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs px-2 py-0 ${
                                    savedBook.status === 'reading' ? 'border-nexus-gold text-nexus-gold' :
                                    savedBook.status === 'completed' ? 'border-nexus-green text-nexus-green' :
                                    'border-nexus-blue text-nexus-blue'
                                  }`}
                                >
                                  {savedBook.status}
                                </Badge>
                                {savedBook.subject && (
                                  <Badge variant="outline" className="text-xs px-2 py-0">
                                    {savedBook.subject.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar (if reading) */}
                          {savedBook.status === 'reading' && savedBook.progress > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-nexus-green">{savedBook.progress}%</span>
                              </div>
                              <div className="w-full bg-muted-foreground/20 rounded-full h-1">
                                <div 
                                  className="bg-nexus-green h-1 rounded-full transition-all"
                                  style={{ width: `${savedBook.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Notes (if any) */}
                          {savedBook.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              Notes: {savedBook.notes}
                            </p>
                          )}

                          {/* Last accessed */}
                          {savedBook.lastAccessedAt && (
                            <p className="text-xs text-muted-foreground">
                              Last read: {new Date(savedBook.lastAccessedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="glass-effect border-nexus-green/20">
                <CardContent className="p-8 text-center">
                  <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-nexus-green mb-2">
                    Your library is empty
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your collection by searching and saving books from the Search tab.
                  </p>
                  <Button
                    onClick={() => {
                      // Switch to search tab
                      const searchTab = document.querySelector('[value="search"]') as HTMLElement;
                      searchTab?.click();
                    }}
                    className="bg-nexus-green hover:bg-nexus-green/80 text-nexus-black font-semibold"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Books
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}