#!/usr/bin/env python3
import requests
import json
import sys
from urllib.parse import quote_plus

def search_archive_org_books(query, category=None, limit=20):
    """
    Search Archive.org for books using their advanced search API
    """
    try:
        # Build search query - simpler approach for Archive.org
        search_terms = []
        
        # Add the main query
        if query:
            search_terms.append(f'({query})')
        
        # Add category filter if specified
        if category and category != 'all' and category != 'null':
            category_map = {
                'science': 'science',
                'mathematics': 'mathematics',
                'engineering': 'engineering',
                'physics': 'physics',
                'chemistry': 'chemistry',
                'biology': 'biology',
                'computer': 'computer',
                'programming': 'programming',
                'history': 'history',
                'literature': 'literature',
                'philosophy': 'philosophy',
                'business': 'business',
                'economics': 'economics'
            }
            if category in category_map:
                search_terms.append(f'subject:{category_map[category]}')
        
        # Always filter for books/texts
        search_terms.append('mediatype:texts')
        
        # Combine search terms
        search_query = ' AND '.join(search_terms)
        
        # Use the regular search API  
        url = "https://archive.org/advancedsearch.php"
        params = {
            'q': search_query,
            'fl': 'identifier,title,creator,date,subject,description,downloads,item_size,format,language',
            'sort': 'downloads desc',
            'rows': min(limit, 50),
            'output': 'json'
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        books = []
        
        # Handle different response formats
        docs = []
        if 'response' in data and 'docs' in data['response']:
            docs = data['response']['docs']
        elif 'items' in data:
            docs = data['items']
        
        if docs:
            for idx, item in enumerate(docs):
                # Get additional metadata for each item
                identifier = item.get('identifier', '')
                if not identifier:
                    continue
                
                book = {
                    'id': idx + 1,
                    'identifier': identifier,
                    'title': item.get('title', 'Unknown Title'),
                    'author': ', '.join(item.get('creator', [])) if isinstance(item.get('creator'), list) else item.get('creator', 'Unknown Author'),
                    'year': item.get('date', 'Unknown'),
                    'subject': ', '.join(item.get('subject', [])) if isinstance(item.get('subject'), list) else item.get('subject', ''),
                    'description': item.get('description', ''),
                    'downloads': item.get('downloads', 0),
                    'size': item.get('item_size', 0),
                    'language': ', '.join(item.get('language', [])) if isinstance(item.get('language'), list) else item.get('language', 'en'),
                    'format': ', '.join(item.get('format', [])) if isinstance(item.get('format'), list) else item.get('format', ''),
                    'viewUrl': f'https://archive.org/details/{identifier}',
                    'downloadUrl': f'https://archive.org/download/{identifier}',
                    'imageUrl': f'https://archive.org/services/img/{identifier}',
                    'category': 'books',
                    'popularity': item.get('downloads', 0)
                }
                books.append(book)
        
        return {
            'success': True,
            'books': books,
            'total': len(books)
        }
        
    except requests.RequestException as e:
        return {
            'success': False,
            'error': f'Network error: {str(e)}',
            'books': []
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Search error: {str(e)}',
            'books': []
        }

def get_book_details(identifier):
    """
    Get detailed information about a specific book
    """
    try:
        # Get metadata
        metadata_url = f"https://archive.org/metadata/{identifier}"
        response = requests.get(metadata_url, timeout=15)
        response.raise_for_status()
        
        metadata = response.json()
        
        if 'metadata' not in metadata:
            return {'success': False, 'error': 'Book not found'}
        
        meta = metadata['metadata']
        files = metadata.get('files', [])
        
        # Find download URLs for different formats
        download_urls = {}
        for file in files:
            name = file.get('name', '').lower()
            source = file.get('source', '').lower()
            if source == 'original' or 'original' in name:
                format_ext = name.split('.')[-1] if '.' in name else ''
                if format_ext in ['pdf', 'epub', 'txt', 'djvu']:
                    download_urls[format_ext] = f"https://archive.org/download/{identifier}/{file['name']}"
        
        return {
            'success': True,
            'identifier': identifier,
            'title': meta.get('title', 'Unknown Title'),
            'creator': ', '.join(meta.get('creator', [])) if isinstance(meta.get('creator'), list) else meta.get('creator', 'Unknown Author'),
            'description': meta.get('description', ''),
            'date': meta.get('date', 'Unknown'),
            'subject': ', '.join(meta.get('subject', [])) if isinstance(meta.get('subject'), list) else meta.get('subject', ''),
            'language': ', '.join(meta.get('language', [])) if isinstance(meta.get('language'), list) else meta.get('language', 'en'),
            'downloads': meta.get('downloads', 0),
            'downloadUrls': download_urls,
            'viewUrl': f'https://archive.org/details/{identifier}',
            'imageUrl': f'https://archive.org/services/img/{identifier}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to get book details: {str(e)}'
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command provided'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "search":
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Query required for search'}))
            sys.exit(1)
        
        query = sys.argv[2]
        category = sys.argv[3] if len(sys.argv) > 3 else None
        limit = int(sys.argv[4]) if len(sys.argv) > 4 else 20
        
        result = search_archive_org_books(query, category, limit)
        print(json.dumps(result))
    
    elif command == "details":
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Identifier required for details'}))
            sys.exit(1)
        
        identifier = sys.argv[2]
        result = get_book_details(identifier)
        print(json.dumps(result))
    
    else:
        print(json.dumps({'success': False, 'error': f'Unknown command: {command}'}))
        sys.exit(1)