"""
Clear test data from Qdrant
"""
from app.services.qdrant_service import get_qdrant_service
from qdrant_client.models import Filter, FieldCondition, MatchValue

def clear_test_documents():
    """Remove all test documents from Qdrant"""
    qdrant = get_qdrant_service()
    
    print("\n" + "="*60)
    print("Clearing Test Data from Qdrant")
    print("="*60)
    
    # Get all points
    points = qdrant.client.scroll(
        collection_name=qdrant.collection_name,
        limit=1000,
        with_payload=True,
        with_vectors=False
    )[0]
    
    if not points:
        print("✅ No documents found - collection is already empty")
        return
    
    print(f"\nFound {len(points)} chunks in Qdrant")
    
    # Group by doc_id
    docs = {}
    for point in points:
        doc_id = point.payload.get('doc_id')
        title = point.payload.get('title', 'Unknown')
        if doc_id not in docs:
            docs[doc_id] = {'title': title, 'chunks': 0}
        docs[doc_id]['chunks'] += 1
    
    print(f"\nDocuments to delete:")
    for doc_id, info in docs.items():
        print(f"  - {info['title']} (ID: {doc_id}, {info['chunks']} chunks)")
    
    # Confirm deletion
    confirm = input("\nDelete all documents? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("❌ Deletion cancelled")
        return
    
    # Delete all points
    point_ids = [point.id for point in points]
    qdrant.client.delete(
        collection_name=qdrant.collection_name,
        points_selector=point_ids
    )
    
    print(f"\n✅ Deleted {len(point_ids)} chunks from Qdrant")
    print("✅ Collection is now empty")
    
    # Verify
    remaining = qdrant.client.scroll(
        collection_name=qdrant.collection_name,
        limit=10,
        with_payload=False,
        with_vectors=False
    )[0]
    
    print(f"\nVerification: {len(remaining)} chunks remaining")
    print("="*60)

if __name__ == "__main__":
    clear_test_documents()
