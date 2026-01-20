"""
Simple Qdrant connection test (without embeddings)
Run this first to verify your credentials work
"""

from qdrant_client import QdrantClient

# Your credentials
QDRANT_URL = "https://b14e5c19-5cc1-4562-be4e-b17c08c7740e.us-east4-0.gcp.cloud.qdrant.io:6333"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.OvI08fmeKXzI1GPRAqNmjDsM6jQ4q7ewS2-ooUpYCHQ"

print("=" * 60)
print("Qdrant Connection Test (Simple)")
print("=" * 60)

print("\n⏳ Connecting to Qdrant Cloud...")
try:
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=30
    )
    print("✓ Connected successfully!")
except Exception as e:
    print(f"✗ Connection failed: {e}")
    exit(1)

print("\n⏳ Fetching collections...")
try:
    collections = client.get_collections()
    print(f"✓ Found {len(collections.collections)} collection(s)")
    
    if collections.collections:
        for col in collections.collections:
            print(f"  - {col.name}")
    else:
        print("  (No collections yet - this is normal for a new cluster)")
except Exception as e:
    print(f"✗ Failed to get collections: {e}")
    exit(1)

print("\n" + "=" * 60)
print("✓ Connection test passed!")
print("=" * 60)
print("\nYour Qdrant Cloud is ready to use!")
print("Next: Wait for full installation to complete, then run:")
print("  python test_qdrant.py")
