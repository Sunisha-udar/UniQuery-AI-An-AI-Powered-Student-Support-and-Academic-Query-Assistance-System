"""
Test script for documents API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("Testing Health Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_list_documents():
    """Test list documents endpoint"""
    print("\n" + "="*60)
    print("Testing List Documents Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/documents")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            docs = response.json()
            print(f"Found {len(docs)} documents")
            
            if docs:
                print("\nFirst document:")
                print(json.dumps(docs[0], indent=2))
            else:
                print("No documents found (this is normal if you haven't uploaded any yet)")
            
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_list_with_filters():
    """Test list documents with filters"""
    print("\n" + "="*60)
    print("Testing List Documents with Filters")
    print("="*60)
    
    try:
        # Test with category filter
        response = requests.get(f"{BASE_URL}/api/documents?category=syllabus")
        print(f"Status (category=syllabus): {response.status_code}")
        
        if response.status_code == 200:
            docs = response.json()
            print(f"Found {len(docs)} syllabus documents")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("\n🧪 Testing Documents API Endpoints")
    print("="*60)
    print("Make sure the backend server is running on http://localhost:8000")
    print("="*60)
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    results.append(("List Documents", test_list_documents()))
    results.append(("List with Filters", test_list_with_filters()))
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n✅ All tests passed!")
        print("\nThe documents API is working correctly.")
        print("If you see 0 documents, upload a document through the frontend.")
    else:
        print("\n❌ Some tests failed!")
        print("Check the error messages above.")
