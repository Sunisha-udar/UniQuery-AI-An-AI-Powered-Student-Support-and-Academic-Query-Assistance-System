#!/usr/bin/env python3
"""
Fix embedding dimension mismatch in Qdrant
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.qdrant_service import get_qdrant_service
from app.config import get_settings

def diagnose():
    """Diagnose the embedding issue"""
    print("=" * 80)
    print("DIAGNOSING QDRANT EMBEDDING ISSUE")
    print("=" * 80)
    
    settings = get_settings()
    qdrant = get_qdrant_service()
    
    # Check collection info
    try:
        collection_info = qdrant.client.get_collection(settings.qdrant_collection_name)
        print(f"\nCollection: {settings.qdrant_collection_name}")
        print(f"Points count: {collection_info.points_count}")
        print(f"Vector config: {collection_info.config.params.vectors}")
        
        # Get actual vector dimension from collection
        vector_size = collection_info.config.params.vectors.size
        print(f"\nCurrent collection vector dimension: {vector_size}")
        print(f"Config expects dimension: {settings.embedding_dimension}")
        
        if vector_size != settings.embedding_dimension:
            print(f"\n*** MISMATCH DETECTED ***")
            print(f"Collection has {vector_size}D vectors but config expects {settings.embedding_dimension}D")
            print(f"\nSOLUTION OPTIONS:")
            print(f"1. Recreate collection with correct dimension (DELETES ALL DATA)")
            print(f"2. Update .env to match collection dimension: EMBEDDING_DIMENSION={vector_size}")
            return False
        else:
            print(f"\n*** Dimensions match! ***")
            return True
            
    except Exception as e:
        print(f"Error: {e}")
        return False

def fix_by_recreating():
    """Recreate collection with correct dimension"""
    print("\n" + "=" * 80)
    print("RECREATING COLLECTION")
    print("=" * 80)
    
    settings = get_settings()
    qdrant = get_qdrant_service()
    
    confirm = input(f"\nThis will DELETE all data in '{settings.qdrant_collection_name}'. Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Aborted.")
        return False
    
    try:
        # Delete collection
        print(f"\nDeleting collection '{settings.qdrant_collection_name}'...")
        qdrant.client.delete_collection(settings.qdrant_collection_name)
        print("Deleted.")
        
        # Recreate with correct dimension
        print(f"\nCreating collection with {settings.embedding_dimension}D vectors...")
        success = qdrant.create_collection()
        
        if success:
            print("Collection recreated successfully!")
            print("\nNEXT STEPS:")
            print("1. Re-upload all your PDFs through the frontend")
            print("2. Test the chatbot with: 'is bringing laptop necessary in classroom?'")
            return True
        else:
            print("Failed to create collection")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    try:
        print("\nStep 1: Diagnosing...")
        is_ok = diagnose()
        
        if not is_ok:
            print("\n" + "=" * 80)
            choice = input("\nChoose fix option:\n1. Recreate collection (deletes data)\n2. Exit and manually update .env\n\nChoice (1/2): ")
            
            if choice == "1":
                fix_by_recreating()
            else:
                print("\nManual fix: Update EMBEDDING_DIMENSION in .env file")
        else:
            print("\nNo issues found. Testing search...")
            qdrant = get_qdrant_service()
            results = qdrant.search("laptop classroom", limit=3)
            if results:
                print(f"\nFound {len(results)} results for 'laptop classroom':")
                for r in results:
                    print(f"  - {r['title']} (score: {r['score']:.3f})")
            else:
                print("\nNo results found. The laptop document may not be uploaded yet.")
                
    except KeyboardInterrupt:
        print("\n\nInterrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
