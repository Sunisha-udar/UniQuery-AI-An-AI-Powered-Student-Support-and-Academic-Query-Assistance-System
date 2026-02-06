"""
Check if Render backend can access Qdrant properly
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

RENDER_BACKEND = "https://uniquery-backend.onrender.com"

def check_render_backend():
    """Check if Render backend is responding"""
    print(f"\n🔍 Checking Render backend at: {RENDER_BACKEND}")
    
    try:
        # 1. Health check
        print("\n1️⃣ Testing health endpoint...")
        response = requests.get(f"{RENDER_BACKEND}/health", timeout=30)
        print(f"✅ Health check: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # 2. Test a real query
        print("\n2️⃣ Testing query endpoint with attendance question...")
        query_response = requests.post(
            f"{RENDER_BACKEND}/api/query",
            json={"question": "minimum attendance required per course?"},
            timeout=60
        )
        
        print(f"Status: {query_response.status_code}")
        
        if query_response.status_code == 200:
            result = query_response.json()
            answer = result.get('answer', 'No answer')
            citations = result.get('citations', [])
            
            print(f"\n📝 Answer received:")
            print(f"{answer[:300]}...")
            print(f"\n📚 Citations: {len(citations)} found")
            
            if len(citations) > 0:
                print("\n✅ Render backend CAN access Qdrant data!")
                for i, citation in enumerate(citations[:3], 1):
                    print(f"  {i}. {citation.get('title', 'N/A')} (page {citation.get('page', 'N/A')})")
            else:
                print("\n⚠️ WARNING: No citations found - Qdrant might be empty on Render!")
                
            # Check if it's the "I don't have information" response
            if "I don't have information" in answer or "my current knowledge base" in answer:
                print("\n❌ ISSUE: Backend returned 'no information' response")
                print("   This means Qdrant search returned 0 results")
                return False
            else:
                print("\n✅ Backend is working correctly!")
                return True
        else:
            print(f"❌ Query failed: {query_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_render_env_vars():
    """Provide instructions to check Render environment variables"""
    print("\n" + "="*60)
    print("📋 RENDER ENVIRONMENT VARIABLES CHECK")
    print("="*60)
    print("\nTo check/set Render environment variables:")
    print("1. Go to: https://dashboard.render.com/")
    print("2. Select your 'uniquery-backend' service")
    print("3. Go to 'Environment' tab")
    print("4. Verify these variables are set:")
    print("\n   Required variables:")
    print("   - QDRANT_URL")
    print("   - QDRANT_API_KEY")
    print("   - QDRANT_COLLECTION_NAME (should be 'uniquery')")
    print("   - VOYAGE_API_KEY")
    print("   - GROQ_API_KEY")
    print("   - SUPABASE_URL")
    print("   - SUPABASE_SERVICE_ROLE_KEY")
    print("   - SUPABASE_ANON_KEY")
    print("\n5. If any are missing or incorrect, add/update them")
    print("6. Render will auto-redeploy after saving changes")
    print("="*60)

if __name__ == "__main__":
    print("="*60)
    print("🚀 Render Backend Diagnostic")
    print("="*60)
    
    success = check_render_backend()
    
    if not success:
        check_render_env_vars()
        
        print("\n" + "="*60)
        print("🔧 DEBUGGING STEPS")
        print("="*60)
        print("\n1. Check Render logs:")
        print("   - Go to Render Dashboard")
        print("   - Select 'uniquery-backend'")
        print("   - Click 'Logs' tab")
        print("   - Look for Qdrant connection errors")
        
        print("\n2. Test Qdrant connection from Render:")
        print("   - Add a test endpoint in your backend")
        print("   - Return Qdrant collection info")
        
        print("\n3. Verify Qdrant is accessible:")
        print("   - Your local machine CAN connect to Qdrant")
        print("   - Render might have network restrictions")
        print("   - Check if Qdrant allows connections from Render's IPs")
        
        print("\n4. Check if Render is using correct collection:")
        print("   - Collection name should be: 'uniquery'")
        print("   - Check QDRANT_COLLECTION_NAME in Render env vars")
        
        print("="*60)
