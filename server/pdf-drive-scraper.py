#!/usr/bin/env python3
"""
PDF Drive scraper for NexusLearn AI
Provides search functionality for PDF Drive without official API
"""

import asyncio
import aiohttp
import json
import sys
from typing import List, Dict, Optional
from urllib.parse import quote, urljoin
from bs4 import BeautifulSoup
import re
import time

class PdfDriveScraper:
    def __init__(self):
        self.base_url = "https://www.pdfdrive.com"
        self.search_url = f"{self.base_url}/search"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
    async def search_books(self, query: str, category: Optional[str] = None, limit: int = 20) -> Dict:
        """
        Search for books on PDF Drive
        """
        try:
            params = {
                'q': query,
                'pagecount': '',
                'pubyear': '',
                'searchin': 'en',
                'more': 'true',
            }
            
            if category:
                params['category'] = category
            
            async with aiohttp.ClientSession(headers=self.headers, timeout=aiohttp.ClientTimeout(total=30)) as session:
                # First, get the search results page
                async with session.get(self.search_url, params=params) as response:
                    if response.status != 200:
                        return {
                            'success': False,
                            'error': f'HTTP {response.status}',
                            'books': []
                        }
                    
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    books = []
                    book_elements = soup.find_all('div', class_='file-right')
                    
                    for idx, element in enumerate(book_elements[:limit]):
                        try:
                            book_data = await self._extract_book_data(element, session)
                            if book_data:
                                book_data['id'] = idx + 1  # Assign temporary ID
                                books.append(book_data)
                        except Exception as e:
                            print(f"Error extracting book data: {e}", file=sys.stderr)
                            continue
                    
                    return {
                        'success': True,
                        'books': books,
                        'total': len(books)
                    }
                    
        except asyncio.TimeoutError:
            return {
                'success': False,
                'error': 'Request timeout',
                'books': []
            }
        except Exception as e:
            print(f"Search error: {e}", file=sys.stderr)
            return {
                'success': False,
                'error': str(e),
                'books': []
            }
    
    async def _extract_book_data(self, element, session) -> Optional[Dict]:
        """
        Extract book information from a search result element
        """
        try:
            book = {}
            
            # Title
            title_elem = element.find('h2', class_='file-title')
            if title_elem and title_elem.find('a'):
                book['title'] = title_elem.find('a').text.strip()
                book['url'] = urljoin(self.base_url, title_elem.find('a')['href'])
            else:
                return None
            
            # Author
            author_elem = element.find('span', class_='file-author')
            if author_elem:
                book['author'] = author_elem.text.strip()
            
            # Pages, Size, Year
            details = element.find('div', class_='file-bottom')
            if details:
                detail_spans = details.find_all('span')
                for span in detail_spans:
                    text = span.text.strip().lower()
                    if 'pages' in text:
                        pages_match = re.search(r'(\d+)\s*pages', text)
                        if pages_match:
                            book['pages'] = int(pages_match.group(1))
                    elif any(unit in text for unit in ['mb', 'kb', 'gb']):
                        book['size'] = span.text.strip()
                    elif len(text) == 4 and text.isdigit():
                        book['year'] = text
            
            # Preview/Description
            preview_elem = element.find('div', class_='file-preview')
            if preview_elem:
                book['preview'] = preview_elem.text.strip()[:200] + '...' if len(preview_elem.text.strip()) > 200 else preview_elem.text.strip()
            
            # Try to get book cover image
            img_elem = element.parent.find('img') if element.parent else None
            if img_elem and img_elem.get('src'):
                book['imageUrl'] = urljoin(self.base_url, img_elem['src'])
            
            # Category (try to infer from page or content)
            if 'category' in book.get('url', ''):
                category_match = re.search(r'/category/([^/]+)', book['url'])
                if category_match:
                    book['category'] = category_match.group(1).replace('-', ' ').title()
            
            # Default values
            book['extension'] = 'pdf'
            book['language'] = 'english'
            book['popularity'] = 0
            
            # Get download URL (this would require additional scraping)
            # For now, we'll store the book page URL
            book['downloadUrl'] = book.get('url', '')
            
            return book
            
        except Exception as e:
            print(f"Error extracting book data: {e}", file=sys.stderr)
            return None
    
    async def get_download_url(self, book_url: str) -> Optional[str]:
        """
        Get the actual download URL for a book
        Note: This is a simplified implementation
        """
        try:
            async with aiohttp.ClientSession(headers=self.headers, timeout=aiohttp.ClientTimeout(total=30)) as session:
                async with session.get(book_url) as response:
                    if response.status != 200:
                        return None
                    
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for download links
                    download_link = soup.find('a', {'class': 'btn-user'}) or soup.find('a', string=re.compile('Download'))
                    if download_link and download_link.get('href'):
                        return urljoin(self.base_url, download_link['href'])
                    
                    return book_url  # Fallback to book page URL
                    
        except Exception as e:
            print(f"Error getting download URL: {e}", file=sys.stderr)
            return book_url

async def main():
    """
    Main function to handle command line usage
    """
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python pdf-drive-scraper.py <search_query> [category] [limit]'
        }))
        return
    
    query = sys.argv[1]
    category = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != 'null' else None
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    
    scraper = PdfDriveScraper()
    
    try:
        result = await scraper.search_books(query, category, limit)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'books': []
        }))

if __name__ == "__main__":
    asyncio.run(main())