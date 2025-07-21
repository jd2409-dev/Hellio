import { useState } from 'react';
import { Search, Download, BookOpen, Eye, Heart, Star, Filter, Loader2, Book, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface PdfBook {
  id: number;
  identifier?: string; // Archive.org identifier
  title: string;
  author?: string;
  pages?: number;
  year?: string;
  size?: string;
  extension?: string;
  preview?: string;
  downloadUrl?: string;
  viewUrl?: string; // Archive.org view URL
  imageUrl?: string;
  category?: string;
  language?: string;
  popularity?: number;
  description?: string;
  subject?: string;
  downloads?: number; // Download count from Archive.org
}

interface Subject {
  id: number;
  name: string;
  color: string;
}

export default function PdfDriveSearch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PdfBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<PdfBook | null>(null);
  const [bookMetadata, setBookMetadata] = useState<any>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Fetch subjects for categorization
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  // Fetch user's saved books
  const { data: savedBooks = [] } = useQuery({
    queryKey: ['/api/pdf-drive/library'],
  });

  // Search PDF Drive
  const searchMutation = useMutation({
    mutationFn: async (data: { query: string; category?: string; limit?: number }) => {
      setIsSearching(true);
      const response = await apiRequest('POST', '/api/pdf-drive/search', data);
      return response;
    },
    onSuccess: (data: any) => {
      setSearchResults(data.books || []);
      setIsSearching(false);
      toast({
        title: 'Search Complete',
        description: `Found ${data.books?.length || 0} books matching your search.`,
      });
    },
    onError: (error) => {
      setIsSearching(false);
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Unable to search Internet Archive. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Save book to library
  const saveBookMutation = useMutation({
    mutationFn: async (data: { bookId: number; subjectId?: number }) => {
      return apiRequest('POST', '/api/pdf-drive/save-book', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pdf-drive/library'] });
      toast({
        title: 'Book Saved',
        description: 'Book added to your library successfully!',
      });
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Unable to save book. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Download book
  const downloadBookMutation = useMutation({
    mutationFn: async (identifier: string) => {
      return apiRequest('POST', `/api/pdf-drive/download/${identifier}`);
    },
    onSuccess: (data: any) => {
      if (data.downloadUrls && Object.keys(data.downloadUrls).length > 0) {
        // Open the Archive.org view page first
        if (data.viewUrl) {
          window.open(data.viewUrl, '_blank');
        }
        toast({
          title: 'Archive.org Opened',
          description: 'Book page opened. You can download various formats from there.',
        });
      } else {
        toast({
          title: 'View Book',
          description: 'Opening book details on Archive.org',
        });
      }
    },
    onError: () => {
      toast({
        title: 'View Failed',
        description: 'Unable to open book details. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // 📦 METADATA FETCH: Get full metadata for selected item (based on your code pattern)
  const fetchBookMetadata = async (identifier: string) => {
    setLoadingMetadata(true);
    try {
      const url = `https://archive.org/metadata/${identifier}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Using your base code structure with enhanced data extraction
      const metadata = {
        title: data.metadata?.title || "Untitled",
        author: Array.isArray(data.metadata?.creator) 
          ? data.metadata.creator.join(", ") 
          : data.metadata?.creator || "Unknown",
        description: Array.isArray(data.metadata?.description)
          ? data.metadata.description.join(" ")
          : data.metadata?.description || "No description available.",
        mediatype: data.metadata?.mediatype || "Unknown",
        collection: Array.isArray(data.metadata?.collection) 
          ? data.metadata.collection.join(", ") 
          : data.metadata?.collection || "None",
        files: data.files || [],
        // Additional metadata for enhanced display
        itemSize: data.item_size,
        server: data.server,
        date: data.metadata?.date,
        language: data.metadata?.language,
        subject: data.metadata?.subject,
        pages: data.metadata?.pages,
        downloads: data.metadata?.downloads || 0
      };
      
      setBookMetadata(metadata);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to load book details.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleViewBookDetails = (book: PdfBook) => {
    setSelectedBook(book);
    if (book.identifier) {
      fetchBookMetadata(book.identifier);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    searchMutation.mutate({
      query: searchQuery.trim(),
      category: searchCategory && searchCategory !== 'all' ? searchCategory : undefined,
      limit: 20,
    });
  };

  const handleSaveBook = (book: PdfBook, subjectId?: number) => {
    saveBookMutation.mutate({
      bookId: book.id,
      subjectId,
    });
  };

  const handleDownloadBook = (book: PdfBook) => {
    if (book.identifier) {
      downloadBookMutation.mutate(book.identifier);
    } else if (book.viewUrl) {
      window.open(book.viewUrl, '_blank');
      toast({
        title: 'View Book',
        description: 'Opening book on Archive.org',
      });
    }
  };

  const isBookSaved = (bookId: number) => {
    return Array.isArray(savedBooks) && savedBooks.some((saved: any) => saved.bookId === bookId);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="glass-effect border-nexus-green/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-nexus-green">
            <BookOpen className="w-5 h-5" />
            Search Internet Archive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search books from Internet Archive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-effect border-nexus-green/20 focus:border-nexus-green"
                />
              </div>
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-48 glass-effect border-nexus-green/20">
                  <SelectValue placeholder="Category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="computer">Computer Science</SelectItem>
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="literature">Literature</SelectItem>
                  <SelectItem value="philosophy">Philosophy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="economics">Economics</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="bg-nexus-green hover:bg-nexus-green/80 text-nexus-black font-semibold px-6"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-nexus-green">
              Search Results ({searchResults.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filter by subject coming soon
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((book) => (
              <Card key={book.id} className="glass-effect border-nexus-green/20 hover:border-nexus-green/40 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Book Cover & Title */}
                    <div className="flex gap-3">
                      <div className="w-16 h-20 bg-nexus-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        {book.imageUrl ? (
                          <img 
                            src={book.imageUrl} 
                            alt={book.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Book className="w-8 h-8 text-nexus-green" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-nexus-green text-sm line-clamp-2 mb-1">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-xs text-muted-foreground mb-2">
                            by {book.author}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {book.pages && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {book.pages}p
                            </Badge>
                          )}
                          {book.size && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {book.size}
                            </Badge>
                          )}
                          {book.year && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              {book.year}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description/Preview */}
                    {(book.description || book.preview) && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {book.description || book.preview}
                      </p>
                    )}
                    
                    {/* Subject and Downloads info */}
                    {(book.subject || book.downloads) && (
                      <div className="flex flex-wrap gap-1">
                        {book.subject && (
                          <Badge variant="secondary" className="text-xs px-2 py-0">
                            {book.subject.split(',')[0]} {/* Show first subject */}
                          </Badge>
                        )}
                        {book.downloads && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            {book.downloads} downloads
                          </Badge>
                        )}
                      </div>
                    )}

                    <Separator className="border-nexus-green/10" />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewBookDetails(book)}
                        className="text-xs border-nexus-green/20 hover:bg-nexus-green/10"
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadBook(book)}
                        disabled={downloadBookMutation.isPending}
                        className="flex-1 text-xs border-nexus-green/20 hover:bg-nexus-green/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View & Download
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveBook(book)}
                        disabled={saveBookMutation.isPending || isBookSaved(book.id)}
                        className="border-nexus-gold/20 hover:bg-nexus-gold/10 text-xs"
                      >
                        <Heart className={`w-3 h-3 mr-1 ${isBookSaved(book.id) ? 'fill-nexus-gold text-nexus-gold' : ''}`} />
                        {isBookSaved(book.id) ? 'Saved' : 'Save'}
                      </Button>
                      
                      {book.preview && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-nexus-green p-2"
                          title="Preview"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {/* Subject Assignment for Saved Books */}
                    {isBookSaved(book.id) && (
                      <Select onValueChange={(value) => handleSaveBook(book, parseInt(value))}>
                        <SelectTrigger className="h-8 text-xs glass-effect border-nexus-green/20">
                          <SelectValue placeholder="Assign to subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: subject.color }}
                                />
                                {subject.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && searchResults.length === 0 && searchQuery && (
        <Card className="glass-effect border-nexus-green/20">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-nexus-green mb-2">
              No books found
            </h3>
            <p className="text-muted-foreground mb-4">
              "{searchQuery}" might not be available in Internet Archive's free collection due to copyright restrictions.
            </p>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground font-medium">
                Try searching for:
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {['classic literature', 'mathematics textbooks', 'science books', 'programming', 'history', 'philosophy'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      searchMutation.mutate({ query: suggestion, category: searchCategory, limit: 20 });
                    }}
                    className="border-nexus-green/20 hover:bg-nexus-green/10 text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="border-nexus-green/20 hover:bg-nexus-green/10"
            >
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery && (
        <Card className="glass-effect border-nexus-green/20">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-nexus-green mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-nexus-green mb-2">
              Discover Educational Books
            </h3>
            <p className="text-muted-foreground mb-4">
              Search through millions of free educational books from Internet Archive. 
              Find textbooks, research papers, and study materials for any subject.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Mathematics', 'Physics', 'Programming', 'Chemistry', 'Biology'].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(category);
                    setSearchCategory(category.toLowerCase());
                  }}
                  className="border-nexus-green/20 hover:bg-nexus-green/10 text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Book Details Modal - Based on your metadata API code */}
      {selectedBook && (
        <Card className="fixed inset-4 z-50 overflow-auto glass-effect border-nexus-green/20 bg-background/95 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-nexus-green">Book Details</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBook(null);
                setBookMetadata(null);
              }}
              className="border-nexus-green/20 hover:bg-nexus-green/10"
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingMetadata ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-nexus-green" />
                <span className="ml-2 text-muted-foreground">Loading book details...</span>
              </div>
            ) : bookMetadata ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-nexus-green mb-2">{bookMetadata.title}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Author:</strong> {bookMetadata.author}
                    </div>
                    <div>
                      <strong>Type:</strong> {bookMetadata.mediatype}
                    </div>
                    <div>
                      <strong>Collection:</strong> {bookMetadata.collection}
                    </div>
                    <div>
                      <strong>Date:</strong> {bookMetadata.date || 'Unknown'}
                    </div>
                    <div>
                      <strong>Size:</strong> {bookMetadata.itemSize ? `${(bookMetadata.itemSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown'}
                    </div>
                    <div>
                      <strong>Server:</strong> {bookMetadata.server}
                    </div>
                  </div>
                </div>

                {bookMetadata.description && (
                  <div>
                    <h3 className="font-semibold text-nexus-green mb-2">Description</h3>
                    <p className="text-muted-foreground text-sm">
                      {bookMetadata.description}
                    </p>
                  </div>
                )}

                {bookMetadata.subject && (
                  <div>
                    <h3 className="font-semibold text-nexus-green mb-2">Subjects</h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(bookMetadata.subject) ? bookMetadata.subject : [bookMetadata.subject]).map((subject: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-nexus-green/20 text-nexus-green">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {bookMetadata.collection && (
                  <div>
                    <h3 className="font-semibold text-nexus-green mb-2">Collections</h3>
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(bookMetadata.collection) ? bookMetadata.collection.join(', ') : bookMetadata.collection}
                    </div>
                  </div>
                )}

                {bookMetadata.files && bookMetadata.files.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-nexus-green mb-2">Available Formats</h3>
                    <div className="space-y-2">
                      {bookMetadata.files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded border border-nexus-green/10">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-nexus-green" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {file.format}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleDownloadBook(selectedBook)}
                    className="bg-nexus-green hover:bg-nexus-green/90 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View on Archive.org
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSaveBook(selectedBook)}
                    className="border-nexus-green/20 hover:bg-nexus-green/10"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Save to Library
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Unable to load book details</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}