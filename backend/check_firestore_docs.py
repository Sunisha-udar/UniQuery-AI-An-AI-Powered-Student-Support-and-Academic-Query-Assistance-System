"""Script to check existing documents in Firestore"""
import sys
sys.path.insert(0, '.')

from app.services.firebase_service import get_firebase_service

fs = get_firebase_service()
docs = fs.list_documents()

print("=" * 60)
print("Documents in Firestore:")
print("=" * 60)

for d in docs:
    print(f"  doc_id:       {d.get('doc_id')}")
    print(f"  title:        {d.get('title')}")
    print(f"  storage_path: {d.get('storage_path', 'N/A')[:80]}...")
    print(f"  category:     {d.get('category')}")
    print(f"  program:      {d.get('program')}")
    print("-" * 40)

print(f"\nTotal documents: {len(docs)}")
