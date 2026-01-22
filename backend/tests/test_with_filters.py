from app.services.qdrant_service import get_qdrant_service

qdrant = get_qdrant_service()

# Simulate frontend query WITH filters (like B.Tech CSE)
print("Testing WITH filters (B.Tech, CSE, Semester 1):")
results = qdrant.search(
    query="What is the attendance requirement for competitive coding?",
    limit=3,
    program="B.Tech",
    department="CSE",
    semester=1
)

if results:
    print(f"Found {len(results)} results")
    print(f"Score: {results[0]['score']:.4f}")
    print(f"Text: {results[0]['text'][:100]}...")
else:
    print("No results found")

print("\n" + "="*70 + "\n")

# Test WITHOUT filters
print("Testing WITHOUT filters:")
results = qdrant.search(
    query="What is the attendance requirement for competitive coding?",
    limit=3
)

if results:
    print(f"Found {len(results)} results")
    print(f"Score: {results[0]['score']:.4f}")
else:
    print("No results found")
