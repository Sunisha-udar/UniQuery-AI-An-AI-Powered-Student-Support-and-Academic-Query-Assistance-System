"""
Quick diagnostic script to check deployment issues
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_backend_health():
    """Check if the backend is running"""
    backend_url = os.getenv("VITE_API_URL", "https://uniquery-backend.onrender.com")
    
    print(f"\n🔍 Checking backend health at: {backend_url}")
    try:
        response = requests.get(f"{backend_url}/health", timeout=10)
        print(f"✅ Backend is UP - Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Backend is DOWN - Error: {e}")
        return False

def check_qdrant_connection():
    """Check Qdrant connection from local environment"""
    from qdrant_client import QdrantClient
    
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    collection_name = os.getenv("QDRANT_COLLECTION_NAME", "uniquery")
    
    print(f"\n🔍 Checking Qdrant connection...")
    print(f"URL: {qdrant_url}")
    print(f"Collection: {collection_name}")
    
    try:
        client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key,
            timeout=30
        )
        
        # Get collection info
        collection_info = client.get_collection(collection_name)
        point_count = collection_info.points_count
        
        print(f"✅ Qdrant connection successful!")
        print(f"📊 Total documents in collection: {point_count}")
        
        if point_count == 0:
            print("⚠️ WARNING: Collection is EMPTY! No documents found.")
            print("   This explains why queries return no results.")
            return False
        else:
            print(f"✅ Collection has {point_count} documents")
            return True
            
    except Exception as e:
        print(f"❌ Qdrant connection failed - Error: {e}")
        return False

def test_query_locally():
    """Test a query through the local environment"""
    backend_url = os.getenv("VITE_API_URL", "https://uniquery-backend.onrender.com")
    
    print(f"\n🔍 Testing query endpoint...")
    query_data = {
        "question": "minimum attendance required per course?"
    }
    
    try:
        response = requests.post(
            f"{backend_url}/api/query",
            json=query_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Query successful!")
            print(f"Answer: {result.get('answer', 'N/A')[:200]}...")
            print(f"Citations: {len(result.get('citations', []))} found")
            return True
        else:
            print(f"❌ Query failed - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Query test failed - Error: {e}")
        return False

def check_environment_vars():
    """Check if all required environment variables are set"""
    print("\n🔍 Checking environment variables...")
    
    required_vars = [
        "QDRANT_URL",
        "QDRANT_API_KEY",
        "QDRANT_COLLECTION_NAME",
        "VOYAGE_API_KEY",
        "GROQ_API_KEY",
        "VITE_API_URL"
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {'*' * 20} (set)")
        else:
            print(f"❌ {var}: NOT SET")
            missing.append(var)
    
    if missing:
        print(f"\n⚠️ Missing variables: {', '.join(missing)}")
        return False
    else:
        print(f"\n✅ All required environment variables are set")
        return True

if __name__ == "__main__":
    print("="*60)
    print("🚀 Deployment Diagnostic Tool")
    print("="*60)
    
    # Run all checks
    env_ok = check_environment_vars()
    backend_ok = check_backend_health()
    qdrant_ok = check_qdrant_connection()
    query_ok = test_query_locally()
    
    print("\n" + "="*60)
    print("📋 SUMMARY")
    print("="*60)
    print(f"Environment Variables: {'✅ OK' if env_ok else '❌ FAILED'}")
    print(f"Backend Health: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"Qdrant Connection: {'✅ OK' if qdrant_ok else '❌ FAILED'}")
    print(f"Query Test: {'✅ OK' if query_ok else '❌ FAILED'}")
    
    if not qdrant_ok:
        print("\n⚠️ ISSUE IDENTIFIED: Qdrant collection appears to be empty!")
        print("   Solution: You need to upload your documents to Qdrant.")
        print("   Run: python backend/create_indices.py")
    
    print("="*60)
