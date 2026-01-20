# Services Documentation

## QdrantService

The `QdrantService` class handles all vector database operations for UniQuery AI.

### Initialization

```python
from app.services.qdrant_service import get_qdrant_service

# Get singleton instance
qdrant = get_qdrant_service()
```

### Methods

#### `create_collection() -> bool`

Creates the Qdrant collection if it doesn't exist.

```python
success = qdrant.create_collection()
```

#### `get_collection_info() -> Optional[Dict[str, Any]]`

Returns information about the collection.

```python
info = qdrant.get_collection_info()
# Returns: {"name": "uniquery", "vectors_count": 1234, "points_count": 1234, "status": "green"}
```

#### `embed_text(text: str) -> List[float]`

Converts a single text string to an embedding vector.

```python
embedding = qdrant.embed_text("What is the attendance policy?")
# Returns: [0.123, -0.456, 0.789, ...] (384 dimensions)
```

#### `embed_batch(texts: List[str]) -> List[List[float]]`

Embeds multiple texts efficiently in batch.

```python
texts = ["Text 1", "Text 2", "Text 3"]
embeddings = qdrant.embed_batch(texts)
# Returns: [[...], [...], [...]]
```

#### `insert_documents(chunks: List[str], metadata: List[Dict[str, Any]]) -> bool`

Inserts document chunks with metadata into Qdrant.

```python
chunks = [
    "The minimum attendance is 75%.",
    "Students must attend all lectures."
]

metadata = [
    {
        "id": "chunk_001",
        "program": "B.Tech",
        "department": "CSE",
        "semester": 3,
        "category": "attendance",
        "doc_id": "doc_123",
        "page": 1,
        "title": "Attendance Policy 2024",
        "version": 1
    },
    {
        "id": "chunk_002",
        "program": "B.Tech",
        "department": "CSE",
        "semester": 3,
        "category": "attendance",
        "doc_id": "doc_123",
        "page": 1,
        "title": "Attendance Policy 2024",
        "version": 1
    }
]

success = qdrant.insert_documents(chunks, metadata)
```

#### `search(...) -> List[Dict[str, Any]]`

Performs semantic search with optional metadata filtering.

**Parameters:**
- `query` (str): Natural language query
- `program` (Optional[str]): Filter by program (e.g., "B.Tech")
- `department` (Optional[str]): Filter by department (e.g., "CSE")
- `semester` (Optional[int]): Filter by semester number
- `category` (Optional[str]): Filter by document category
- `limit` (int): Maximum results (default: 5)

**Returns:** List of results with text, score, and metadata

```python
results = qdrant.search(
    query="What is the attendance requirement?",
    program="B.Tech",
    department="CSE",
    semester=3,
    category="attendance",
    limit=5
)

# Returns:
# [
#     {
#         "text": "The minimum attendance is 75%...",
#         "score": 0.92,
#         "title": "Attendance Policy 2024",
#         "page": 1,
#         "category": "attendance",
#         "program": "B.Tech",
#         "department": "CSE",
#         "semester": 3,
#         "doc_id": "doc_123"
#     },
#     ...
# ]
```

#### `delete_by_doc_id(doc_id: str) -> bool`

Deletes all chunks belonging to a specific document.

```python
success = qdrant.delete_by_doc_id("doc_123")
```

#### `health_check() -> bool`

Checks if Qdrant connection is healthy.

```python
is_healthy = qdrant.health_check()
```

## Usage Examples

### Example 1: Upload a Document

```python
from app.services.qdrant_service import get_qdrant_service

# Initialize service
qdrant = get_qdrant_service()

# Your document chunks (from PDF processing)
chunks = [
    "Chapter 1: Introduction to Python...",
    "Python is a high-level programming language...",
    "Variables in Python are dynamically typed..."
]

# Metadata for each chunk
metadata = [
    {
        "id": f"cse_syllabus_chunk_{i}",
        "program": "B.Tech",
        "department": "CSE",
        "semester": 3,
        "category": "syllabus",
        "doc_id": "cse_syllabus_2024",
        "page": i + 1,
        "title": "CSE Syllabus 2024",
        "version": 1
    }
    for i in range(len(chunks))
]

# Insert into Qdrant
success = qdrant.insert_documents(chunks, metadata)
```

### Example 2: Search for Answers

```python
from app.services.qdrant_service import get_qdrant_service

qdrant = get_qdrant_service()

# User query
user_query = "Is Python in the 3rd semester syllabus?"

# Search with filters
results = qdrant.search(
    query=user_query,
    program="B.Tech",
    department="CSE",
    semester=3,
    category="syllabus",
    limit=3
)

# Process results
for result in results:
    print(f"Score: {result['score']:.2f}")
    print(f"Text: {result['text']}")
    print(f"Source: {result['title']}, Page {result['page']}")
    print("---")
```

### Example 3: Update a Document (Delete + Re-insert)

```python
from app.services.qdrant_service import get_qdrant_service

qdrant = get_qdrant_service()

# Delete old version
doc_id = "cse_syllabus_2024"
qdrant.delete_by_doc_id(doc_id)

# Insert new version
new_chunks = [...]  # New document chunks
new_metadata = [...]  # Updated metadata with version=2
qdrant.insert_documents(new_chunks, new_metadata)
```

## Configuration

Settings are loaded from environment variables via `app/config.py`:

```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key
QDRANT_COLLECTION_NAME=uniquery
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
EMBEDDING_DIMENSION=384
```

## Performance Tips

1. **Batch Operations**: Use `embed_batch()` instead of multiple `embed_text()` calls
2. **Metadata Filtering**: Always use filters (program, department, semester) to reduce search space
3. **Limit Results**: Keep `limit` parameter reasonable (5-10 results)
4. **Connection Pooling**: The service uses a singleton pattern for connection reuse

## Error Handling

All methods log errors and return safe defaults:
- `insert_documents()` returns `False` on failure
- `search()` returns empty list `[]` on failure
- `health_check()` returns `False` on connection issues

Always check return values in production code.
