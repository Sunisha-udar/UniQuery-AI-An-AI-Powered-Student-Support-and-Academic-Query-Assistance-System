#!/usr/bin/env python3
"""
Qdrant Management CLI
Utility script for managing the Qdrant collection
"""

import sys
import os
import argparse

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.qdrant_service import get_qdrant_service
from app.config import get_settings


def info():
    """Display collection information"""
    print("Fetching collection info...")
    qdrant = get_qdrant_service()
    
    info = qdrant.get_collection_info()
    if info:
        print("\n" + "=" * 50)
        print("Collection Information")
        print("=" * 50)
        print(f"Name:          {info['name']}")
        print(f"Points:        {info['points_count']:,}")
        print(f"Vectors:       {info['vectors_count']:,}")
        print(f"Status:        {info['status']}")
        print("=" * 50)
    else:
        print("❌ Failed to get collection info")


def create():
    """Create the collection"""
    print("Creating collection...")
    qdrant = get_qdrant_service()
    
    if qdrant.create_collection():
        print("✅ Collection created successfully")
        info()
    else:
        print("❌ Failed to create collection")


def delete_doc(doc_id: str):
    """Delete all chunks for a document"""
    print(f"Deleting document: {doc_id}")
    qdrant = get_qdrant_service()
    
    if qdrant.delete_by_doc_id(doc_id):
        print(f"✅ Document '{doc_id}' deleted successfully")
        info()
    else:
        print(f"❌ Failed to delete document '{doc_id}'")


def search_test(query: str):
    """Test search functionality"""
    print(f"Searching for: '{query}'")
    qdrant = get_qdrant_service()
    
    results = qdrant.search(query=query, limit=5)
    
    if results:
        print(f"\n✅ Found {len(results)} results:\n")
        for i, result in enumerate(results, 1):
            print(f"Result {i}:")
            print(f"  Score:      {result['score']:.4f}")
            print(f"  Text:       {result['text'][:100]}...")
            print(f"  Title:      {result['title']}")
            print(f"  Page:       {result['page']}")
            print(f"  Category:   {result['category']}")
            print(f"  Program:    {result['program']}")
            print(f"  Department: {result['department']}")
            print()
    else:
        print("❌ No results found")


def health():
    """Check Qdrant health"""
    print("Checking Qdrant health...")
    qdrant = get_qdrant_service()
    
    if qdrant.health_check():
        print("✅ Qdrant is healthy")
        info()
    else:
        print("❌ Qdrant health check failed")


def main():
    parser = argparse.ArgumentParser(
        description="Qdrant Management CLI for UniQuery AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manage_qdrant.py info                    # Show collection info
  python manage_qdrant.py create                  # Create collection
  python manage_qdrant.py health                  # Health check
  python manage_qdrant.py search "attendance"     # Test search
  python manage_qdrant.py delete doc_123          # Delete document
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Info command
    subparsers.add_parser('info', help='Display collection information')
    
    # Create command
    subparsers.add_parser('create', help='Create the collection')
    
    # Health command
    subparsers.add_parser('health', help='Check Qdrant health')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Test search functionality')
    search_parser.add_argument('query', help='Search query')
    
    # Delete command
    delete_parser = subparsers.add_parser('delete', help='Delete a document by ID')
    delete_parser.add_argument('doc_id', help='Document ID to delete')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == 'info':
            info()
        elif args.command == 'create':
            create()
        elif args.command == 'health':
            health()
        elif args.command == 'search':
            search_test(args.query)
        elif args.command == 'delete':
            delete_doc(args.doc_id)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
