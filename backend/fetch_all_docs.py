#!/usr/bin/env python3
"""
Fetch all documents from Qdrant and display their content
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.qdrant_service import get_qdrant_service
from collections import defaultdict

def fetch_all_documents():
    """Fetch all documents from Qdrant and organize by doc_id"""
    print("Fetching all documents from Qdrant...\n")
    
    qdrant = get_qdrant_service()
    
    # Get collection info
    info = qdrant.get_collection_info()
    if not info:
        print("❌ Failed to get collection info")
        return
    
    print(f"Collection: {info['name']}")
    print(f"Total chunks: {info['points_count']:,}\n")
    print("=" * 80)
    
    # Fetch all points
    documents = defaultdict(list)
    offset = None
    total_fetched = 0
    
    while True:
        result = qdrant.client.scroll(
            collection_name=qdrant.collection_name,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )
        
        batch_points, next_offset = result
        
        for point in batch_points:
            doc_id = point.payload.get('doc_id', 'unknown')
            documents[doc_id].append({
                'text': point.payload.get('text', ''),
                'page': point.payload.get('page', 0),
                'title': point.payload.get('title', 'Untitled'),
                'category': point.payload.get('category', 'Unknown'),
                'program': point.payload.get('program', 'Unknown'),
                'department': point.payload.get('department', 'Unknown'),
                'semester': point.payload.get('semester', 0)
            })
            total_fetched += 1
        
        if next_offset is None:
            break
        offset = next_offset
        print(f"Fetched {total_fetched} chunks...", end='\r')
    
    print(f"\n✅ Fetched {total_fetched} chunks from {len(documents)} documents\n")
    print("=" * 80)
    
    # Display documents
    for doc_id, chunks in sorted(documents.items()):
        # Get metadata from first chunk
        first_chunk = chunks[0]
        
        print(f"\n📄 Document: {first_chunk['title']}")
        print(f"   Doc ID: {doc_id}")
        print(f"   Category: {first_chunk['category']}")
        print(f"   Program: {first_chunk['program']}")
        print(f"   Department: {first_chunk['department']}")
        print(f"   Semester: {first_chunk['semester']}")
        print(f"   Total Chunks: {len(chunks)}")
        print(f"   Pages: {min(c['page'] for c in chunks)} - {max(c['page'] for c in chunks)}")
        print("-" * 80)
        
        # Sort chunks by page
        sorted_chunks = sorted(chunks, key=lambda x: x['page'])
        
        # Display content
        current_page = None
        for chunk in sorted_chunks:
            if chunk['page'] != current_page:
                current_page = chunk['page']
                print(f"\n[Page {current_page}]")
            print(chunk['text'])
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    try:
        fetch_all_documents()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
