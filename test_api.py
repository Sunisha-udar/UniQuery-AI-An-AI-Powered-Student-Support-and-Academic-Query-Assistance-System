import requests

try:
    # Test health endpoint
    r = requests.get('http://localhost:8000/health')
    print(f"Health: {r.status_code}")
    
    # Test documents endpoint
    r = requests.get('http://localhost:8000/api/documents')
    print(f"Documents: {r.status_code}")
    print(f"Response: {r.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
