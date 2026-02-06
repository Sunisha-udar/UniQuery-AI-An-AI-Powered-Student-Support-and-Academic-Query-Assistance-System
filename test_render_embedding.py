"""
Test if Render can generate embeddings via Voyage API
"""
import requests

RENDER_BACKEND = "https://uniquery-backend.onrender.com"

def test_embedding_endpoint():
    """Test if backend can create embeddings"""
    print("\n🔍 Testing if Render backend can generate embeddings...")
    
    # Create a debug endpoint request - we'll need to add this endpoint first
    query_data = {
        "question": "attendance"  # Simple query
    }
    
    try:
        # Test the actual query
        response = requests.post(
            f"{RENDER_BACKEND}/api/query",
            json=query_data,
            timeout=60,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        
        print(f"\n📝 Answer: {result.get('answer', 'No answer')[:200]}")
        print(f"📚 Citations: {len(result.get('citations', []))}")
        
        if len(result.get('citations', [])) == 0:
            print("\n⚠️ Still getting 0 citations!")
            print("\nPossible causes:")
            print("1. Voyage API key not set in Render environment variables")
            print("2. Voyage API requests failing from Render")
            print("3. Embedding dimension mismatch (should be 512)")
            print("4. Query embeddings using wrong input_type")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def check_voyage_config():
    """Check Voyage AI configuration"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    print("\n🔍 Voyage AI Configuration:")
    print(f"VOYAGE_API_KEY: {'SET' if os.getenv('VOYAGE_API_KEY') else 'NOT SET'}")
    print(f"EMBEDDING_DIMENSION: {os.getenv('EMBEDDING_DIMENSION', 'NOT SET')}")
    print(f"\n Expected values:")
    print(f"  - VOYAGE_API_KEY: pa-Yja6ImNfBUCrWknd_MP5LduRSTulNvkE4W0TucQ1q3_")
    print(f"  - EMBEDDING_DIMENSION: 512")
    print(f"  - Model: voyage-3-lite")

if __name__ == "__main__":
    check_voyage_config()
    test_embedding_endpoint()
    
    print("\n" + "="*60)
    print("🔧 NEXT STEPS")
    print("="*60)
    print("\n1. Add a debug endpoint to your backend:")
    print("   GET /api/debug/embedding-test")
    print("   This should:")
    print("   - Try to generate an embedding for 'test'")
    print("   - Return success/failure + error message")
    print("   - Log to Render logs")
    
    print("\n2. Check Render environment variables:")
    print("   - VOYAGE_API_KEY must be set")
    print("   - EMBEDDING_DIMENSION must be 512")
    print("   - Check for typos in variable names")
    
    print("\n3. Check Render logs for:")
    print("   - 'Error embedding text'")
    print("   - 'VOYAGE_API_KEY environment variable is not set'")
    print("   - Any HTTP errors from Voyage API")
    print("="*60)
