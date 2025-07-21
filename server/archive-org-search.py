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
        # Build comprehensive search query for Archive.org
        search_parts = []
        
        # Create broad search terms from the query
        if query:
            query_words = [word.lower() for word in query.split() if len(word) > 2]
            
            # For better book discovery, create multiple search strategies
            search_strategies = []
            
            # Strategy 1: Full phrase search in title and description
            full_query = query.replace('"', '').strip()
            if full_query:
                search_strategies.extend([
                    f'title:"{full_query}"',
                    f'description:"{full_query}"',
                    f'subject:"{full_query}"'
                ])
            
            # Strategy 2: SMART SEARCH - Expanded field logic (based on your pattern)
            fields = ["title", "subject", "creator", "description"]
            for word in query_words:
                # Your base pattern: field:(keyword) with enhancements
                field_queries = []
                for field in fields:
                    field_queries.extend([
                        f'{field}:({word})',       # Your exact base pattern
                        f'{field}:*{word}*',       # Wildcard for partial matches
                        f'{field}:"{word}"'        # Exact phrase matching
                    ])
                search_strategies.extend(field_queries)
            
            # Strategy 3: For multi-word queries, try partial combinations
            if len(query_words) > 1:
                for i in range(len(query_words)):
                    for j in range(i + 1, len(query_words)):
                        pair = f'"{query_words[i]} {query_words[j]}"'
                        search_strategies.extend([
                            f'title:{pair}',
                            f'description:{pair}'
                        ])
            
            # Combine all strategies with OR
            if search_strategies:
                search_parts.append(f'({" OR ".join(search_strategies)})')
        
        # Add category filter if specified
        if category and category != 'all' and category != 'null':
            category_map = {
                'science': ['science', 'physics', 'chemistry', 'biology', 'scientific'],
                'mathematics': ['mathematics', 'math', 'algebra', 'calculus', 'geometry', 'mathematical'],
                'engineering': ['engineering', 'technology', 'mechanical', 'electrical', 'technical'],
                'physics': ['physics', 'mechanics', 'thermodynamics', 'quantum', 'physical'],
                'chemistry': ['chemistry', 'organic', 'inorganic', 'biochemistry', 'chemical'],
                'biology': ['biology', 'genetics', 'anatomy', 'botany', 'zoology', 'biological'],
                'computer': ['computer', 'programming', 'software', 'algorithms', 'computing'],
                'programming': ['programming', 'coding', 'software', 'development', 'code'],
                'history': ['history', 'historical', 'ancient', 'modern', 'chronicle'],
                'literature': ['literature', 'poetry', 'fiction', 'novels', 'literary', 'stories'],
                'philosophy': ['philosophy', 'ethics', 'logic', 'metaphysics', 'philosophical'],
                'business': ['business', 'management', 'economics', 'finance', 'commerce'],
                'economics': ['economics', 'finance', 'money', 'trade', 'economic']
            }
            
            if category in category_map:
                category_terms = [f'subject:{term}' for term in category_map[category]]
                search_parts.append(f'({" OR ".join(category_terms)})')
        
        # Simplified filtering for better results
        search_parts.append('mediatype:texts')
        
        # Basic exclusions only
        exclusions = [
            '-collection:softwarehistory',   # Game manuals
            '-collection:vgmuseum',          # Video games  
        ]
        search_parts.extend(exclusions)
        
        # Combine all parts with AND
        search_query = ' AND '.join(search_parts)
        
        # Use the advanced search API with your base code pattern
        url = "https://archive.org/advancedsearch.php"
        params = {
            'q': search_query,
            'fl[]': ['identifier', 'title', 'creator', 'year', 'description', 'subject', 'downloads', 'item_size', 'format', 'language', 'date'],
            'sort': 'downloads desc',
            'rows': min(limit, 100),
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
            filtered_books = 0
            for idx, item in enumerate(docs):
                # Get additional metadata for each item
                identifier = item.get('identifier', '')
                if not identifier:
                    continue
                
                # Filter out non-book content
                title = item.get('title', '').lower()
                description = str(item.get('description', '')).lower()
                
                # Skip software, manuals, and other non-book content
                skip_keywords = ['manual', 'game', 'software', 'version', 'patch', 'cheat', 
                               'walkthrough', 'strategy guide', 'development', 'beta', 'hint',
                               'crack', 'trainer', 'save file', 'rom', 'emulator']
                
                if any(keyword in title or keyword in description for keyword in skip_keywords):
                    filtered_books += 1
                    continue
                
                book = {
                    'id': len(books) + 1,
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
        
        total_found = data.get('response', {}).get('numFound', 0) if 'response' in data else len(docs)
        
        return {
            'success': True,
            'books': books,
            'total': len(books),
            'query': query,
            'total_found': total_found,
            'message': f"Found {len(books)} relevant books out of {total_found} total results" if books else "No books found matching your search. Try different keywords or browse categories."
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