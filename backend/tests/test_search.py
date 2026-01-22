"""
Test search functionality
"""
from app.services.qdrant_service import get_qdrant_service

def test_search():
    qdrant = get_qdrant_service()
    
    # Test search with a simple query
    print("\n" + "="*60)
    print("Testing Search")
    print("="*60)
    
    # Get collection info
    info = qdrant.get_collection_info()
    print(f"\nCollection: {info['name']}")
    print(f"Points: {info['points_count']}")
    
    # Try a simple search
    query = "hi"
    print(f"\nSearching for: '{query}'")
    
    results = qdrant.search(
        query=query,
        limit=5
    )
    
    print(f"\nFound {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"\n--- Result {i} ---")
        print(f"Score: {result['score']:.4f}")
        print(f"Title: {result.get('title', 'N/A')}")
        print(f"Text: {result.get('text', 'N/A')[:100]}...")
        print(f"Program: {result.get('program', 'N/A')}")
        print(f"Department: {result.get('department', 'N/A')}")

if __name__ == "__main__":
    test_search()
