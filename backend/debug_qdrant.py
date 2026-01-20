
import qdrant_client
from qdrant_client import QdrantClient
import inspect

# print(f"Qdrant Client Version: {qdrant_client.__version__}")

try:
    client = QdrantClient(":memory:")
    print("Methods on QdrantClient:")
    print([m for m in dir(client) if not m.startswith("_")])
    

    if hasattr(client, 'query_points'):
        print("\nclient.query_points exists!")
        print(inspect.signature(client.query_points))
    else:
        print("\nclient.query_points DOES NOT exist!")
except Exception as e:
    print(f"Error initializing client: {e}")
