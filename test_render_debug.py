"""
Test the new debug endpoints on Render
"""
import requests
import json

RENDER_BACKEND = "https://uniquery-backend.onrender.com"

def test_debug_endpoints():
    """Test all debug endpoints"""
    
    print("="*60)
    print("🔍 Testing Render Backend Debug Endpoints")
    print("="*60)
    
    # 1. Environment Check
    print("\n1️⃣ Checking Environment Variables...")
    try:
        response = requests.get(f"{RENDER_BACKEND}/api/debug/env-check", timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("✅ Environment Check:")
            for key, value in data.get("details", {}).items():
                print(f"   {key}: {value}")
        else:
            print(f"❌ Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 2. Embedding Test
    print("\n2️⃣ Testing Embedding Generation...")
    try:
        response = requests.get(f"{RENDER_BACKEND}/api/debug/embedding-test", timeout=60)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                details = data.get("details", {})
                print(f"✅ Embedding Generation Working!")
                print(f"   Query: {details.get('test_query')}")
                print(f"   Dimension: {details.get('embedding_dimension')}")
                print(f"   Model: {details.get('voyage_model')}")
                print(f"   Sample: {details.get('embedding_sample')}")
            else:
                print(f"❌ Embedding Failed:")
                print(f"   Error: {data.get('details', {}).get('error')}")
        else:
            print(f"❌ Request Failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 3. Qdrant Search Test
    print("\n3️⃣ Testing Qdrant Search...")
    try:
        response = requests.get(f"{RENDER_BACKEND}/api/debug/qdrant-test", timeout=60)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                details = data.get("details", {})
                results_count = details.get('results_count', 0)
                
                if results_count > 0:
                    print(f"✅ Qdrant Search Working!")
                    print(f"   Query: '{details.get('test_query')}'")
                    print(f"   Results: {results_count}")
                    print(f"   Collection: {details.get('collection_name')}")
                    
                    print(f"\n   Sample Results:")
                    for i, result in enumerate(details.get('sample_results', []), 1):
                        print(f"   {i}. {result.get('title')} (score: {result.get('score'):.3f})")
                        print(f"      {result.get('text_preview')}...")
                else:
                    print(f"⚠️ Qdrant Search returned 0 results!")
                    print(f"   This is THE PROBLEM - search is failing")
            else:
                print(f"❌ Qdrant Search Failed:")
                print(f"   Error: {data.get('details', {}).get('error')}")
        else:
            print(f"❌ Request Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 4. Actual Query Test
    print("\n4️⃣ Testing Actual Query Endpoint...")
    try:
        response = requests.post(
            f"{RENDER_BACKEND}/api/query",
            json={"question": "minimum attendance required per course?"},
            timeout=60
        )
        if response.status_code == 200:
            data = response.json()
            citations = len(data.get('citations', []))
            
            if citations > 0:
                print(f"✅ Query Working! {citations} citations found")
            else:
                print(f"❌ Query returned 0 citations")
                print(f"   Answer: {data.get('answer', '')[:200]}...")
        else:
            print(f"❌ Request Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*60)
    print("📋 DIAGNOSIS")
    print("="*60)
    print("\nBased on the tests above:")
    print("• If embedding-test FAILS → Voyage API key issue")
    print("• If qdrant-test returns 0 results → Embedding/search issue")
    print("• If qdrant-test works but query fails → Query logic issue")
    print("="*60)

if __name__ == "__main__":
    test_debug_endpoints()
