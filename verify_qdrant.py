
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from backend.app.services.qdrant_service import get_qdrant_service

def verify_content_exists(pattern):
    qdrant = get_qdrant_service()
    
    # Scroll through all points to find the pattern
    offset = None
    found = []
    
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
            text = point.payload.get('text', '')
            if pattern.lower() in text.lower():
                found.append({
                    'id': point.id,
                    'text': text,
                    'page': point.payload.get('page'),
                    'title': point.payload.get('title')
                })
        
        if next_offset is None:
            break
        offset = next_offset

    print(f"Found {len(found)} points matching '{pattern}':")
    for f in found:
        print(f"\nID: {f['id']} | Page: {f['page']} | Title: {f['title']}")
        print(f"Content:\n{f['text']}")
        print("-" * 50)

if __name__ == "__main__":
    verify_content_exists("Dinesh Singh")
