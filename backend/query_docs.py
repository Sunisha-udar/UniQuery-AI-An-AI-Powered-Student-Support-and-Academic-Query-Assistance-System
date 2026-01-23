#!/usr/bin/env python3
"""
Query documents from Qdrant - Interactive mode
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.qdrant_service import get_qdrant_service

def query_documents(query_text, limit=10):
    """Query documents from Qdrant"""
    print(f"\nSearching for: '{query_text}'")
    print("=" * 80)
    
    qdrant = get_qdrant_service()
    
    # Search without filters to get all relevant results
    results = qdrant.search(query=query_text, limit=limit)
    
    if not results:
        print("No results found.")
        return
    
    print(f"\nFound {len(results)} results:\n")
    
    for i, result in enumerate(results, 1):
        print(f"\n[Result {i}] Score: {result['score']:.4f}")
        print(f"Title: {result['title']}")
        print(f"Category: {result['category']}")
        print(f"Program: {result['program']} | Department: {result['department']} | Semester: {result['semester']}")
        print(f"Page: {result['page']}")
        print(f"\nContent:\n{result['text']}")
        print("-" * 80)

def get_collection_stats():
    """Get basic collection statistics"""
    print("\nFetching collection statistics...")
    print("=" * 80)
    
    qdrant = get_qdrant_service()
    info = qdrant.get_collection_info()
    
    if info:
        print(f"\nCollection: {info['name']}")
        print(f"Total chunks: {info['points_count']:,}")
        print(f"Status: {info['status']}")
    else:
        print("Failed to get collection info")

if __name__ == "__main__":
    try:
        # Get collection stats first
        get_collection_stats()
        
        # If query provided as argument
        if len(sys.argv) > 1:
            query = " ".join(sys.argv[1:])
            query_documents(query)
        else:
            # Interactive mode
            print("\n" + "=" * 80)
            print("Interactive Query Mode")
            print("=" * 80)
            print("Enter your queries (or 'quit' to exit)")
            
            while True:
                try:
                    query = input("\nQuery: ").strip()
                    if query.lower() in ['quit', 'exit', 'q']:
                        break
                    if query:
                        query_documents(query)
                except EOFError:
                    break
        
        print("\nDone!")
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
