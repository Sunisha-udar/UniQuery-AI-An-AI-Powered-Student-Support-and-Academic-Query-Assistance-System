"""Script to check existing document IDs in Qdrant"""
import sys
sys.path.insert(0, '.')

from app.services.qdrant_service import get_qdrant_service

qs = get_qdrant_service()
result = qs.client.scroll(
    collection_name='uniquery', 
    limit=100, 
    with_payload=True, 
    with_vectors=False
)

print("=" * 60)
print("Documents in Qdrant:")
print("=" * 60)

# Get unique doc_ids
doc_ids = set()
for point in result[0]:
    doc_id = point.payload.get('doc_id')
    title = point.payload.get('title', 'Unknown')
    if doc_id not in doc_ids:
        doc_ids.add(doc_id)
        print(f"  doc_id: {doc_id}")
        print(f"  title:  {title}")
        print("-" * 40)

print(f"\nTotal unique documents: {len(doc_ids)}")
