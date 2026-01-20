# Qdrant Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Routers    │─────▶│   Services   │─────▶│    Config    │  │
│  │              │      │              │      │              │  │
│  │ - auth.py    │      │ - qdrant_    │      │ - Settings   │  │
│  │ - query.py   │      │   service.py │      │ - Env Vars   │  │
│  │ - documents  │      │              │      │              │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                               │                                  │
└───────────────────────────────┼──────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Qdrant Service      │
                    │   (Singleton)         │
                    ├───────────────────────┤
                    │ - embed_text()        │
                    │ - embed_batch()       │
                    │ - insert_documents()  │
                    │ - search()            │
                    │ - delete_by_doc_id()  │
                    └───────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │  Sentence Transformer │      │   Qdrant Cloud       │
    │  (BGE-Small-EN)       │      │   Vector Database    │
    ├──────────────────────┤      ├──────────────────────┤
    │ - Text → Vector      │      │ - Store Vectors      │
    │ - 384 dimensions     │      │ - Semantic Search    │
    │ - Cosine similarity  │      │ - Metadata Filter    │
    │ - Cached locally     │      │ - 1GB Free Tier      │
    └──────────────────────┘      └──────────────────────┘
```

## Data Flow

### 1. Document Upload Flow

```
PDF Document
    │
    ▼
┌─────────────────┐
│ PDF Processing  │ (To be implemented)
│ - Extract text  │
│ - Split chunks  │
│ - Add metadata  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embedding       │
│ - embed_batch() │
│ - 384D vectors  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Qdrant Insert   │
│ - Store vectors │
│ - Store payload │
│ - Index data    │
└─────────────────┘
```

### 2. Query Flow

```
User Question
    │
    ▼
┌─────────────────┐
│ Query Router    │
│ - Extract       │
│   filters       │
│ - Classify      │
│   category      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embedding       │
│ - embed_text()  │
│ - Query vector  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Qdrant Search   │
│ - Vector search │
│ - Apply filters │
│ - Rank results  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Context         │
│ - Top 5 chunks  │
│ - With metadata │
│ - Scores        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM (Groq)      │ (To be implemented)
│ - Synthesize    │
│ - Add citations │
│ - Return answer │
└─────────────────┘
```

## Vector Storage Schema

### Collection Configuration

```python
{
    "name": "uniquery",
    "vectors": {
        "size": 384,              # BGE-Small-EN dimension
        "distance": "Cosine"      # Similarity metric
    }
}
```

### Point Structure

```python
{
    "id": "doc_123_chunk_5",      # Unique identifier
    "vector": [0.123, -0.456, ...],  # 384D embedding
    "payload": {
        # Document metadata
        "text": "The minimum attendance is 75%...",
        "title": "Attendance Policy 2024",
        "doc_id": "doc_123",
        "page": 5,
        "category": "attendance",
        
        # Filtering metadata
        "program": "B.Tech",
        "department": "CSE",
        "semester": 3,
        "version": 1
    }
}
```

## Search Process

### 1. Query Embedding

```python
query = "What is the attendance requirement?"
query_vector = embed_text(query)
# → [0.234, -0.567, 0.890, ...] (384 dimensions)
```

### 2. Metadata Filtering

```python
filters = {
    "must": [
        {"key": "program", "match": "B.Tech"},
        {"key": "department", "match": "CSE"},
        {"key": "semester", "match": 3},
        {"key": "category", "match": "attendance"}
    ]
}
```

### 3. Vector Search

```python
results = qdrant.search(
    collection_name="uniquery",
    query_vector=query_vector,
    query_filter=filters,
    limit=5
)
```

### 4. Result Ranking

Results are ranked by cosine similarity:
- Score 0.9-1.0: Highly relevant
- Score 0.7-0.9: Relevant
- Score 0.5-0.7: Somewhat relevant
- Score <0.5: Not relevant

## Metadata Routing Strategy

### Program Level
```
All Programs
├── B.Tech
├── M.Tech
├── BCA
├── MCA
└── MBA
```

### Department Level (per Program)
```
B.Tech
├── CSE
├── ECE
├── MECH
├── CIVIL
└── EEE
```

### Semester Level (per Department)
```
CSE
├── Semester 1
├── Semester 2
├── Semester 3
├── ...
└── Semester 8
```

### Category Level (cross-cutting)
```
Categories
├── syllabus
├── exam_rules
├── attendance
├── backlog_rules
├── academic_calendar
├── notices
├── fees
└── admin_info
```

## Filter Combinations

### Example 1: Specific Query
```python
# "What is the attendance for B.Tech CSE 3rd semester?"
filters = {
    "program": "B.Tech",
    "department": "CSE",
    "semester": 3,
    "category": "attendance"
}
# → Highly targeted search
```

### Example 2: Broad Query
```python
# "What are the exam rules?"
filters = {
    "category": "exam_rules"
    # No program/department/semester filters
}
# → Search across all programs
```

### Example 3: Department-Wide Query
```python
# "CSE syllabus for 3rd semester"
filters = {
    "program": "B.Tech",
    "department": "CSE",
    "semester": 3,
    "category": "syllabus"
}
# → Department-specific search
```

## Performance Optimization

### 1. Batch Embedding
```python
# ❌ Slow: One at a time
for chunk in chunks:
    embedding = embed_text(chunk)

# ✅ Fast: Batch processing
embeddings = embed_batch(chunks)
```

### 2. Metadata Pre-filtering
```python
# ✅ Fast: Filter before vector search
results = search(
    query_vector=vec,
    query_filter=filters,  # Reduces search space
    limit=5
)
```

### 3. Result Limiting
```python
# ✅ Optimal: Only get what you need
results = search(query, limit=5)  # Not 100
```

## Scalability

### Free Tier Capacity
- **Storage**: 1GB
- **Vectors**: ~1-2 million chunks (384D)
- **Documents**: ~10,000 PDFs (100 chunks each)
- **Requests**: Unlimited (rate-limited)

### Estimated Usage
```
University with:
- 50 departments
- 100 documents per department
- 100 chunks per document
= 500,000 chunks
= ~200MB storage
= Well within free tier
```

## Error Handling

### Connection Errors
```python
try:
    qdrant = get_qdrant_service()
except Exception as e:
    logger.error(f"Qdrant connection failed: {e}")
    # Fallback to cached responses or error message
```

### Search Errors
```python
results = qdrant.search(query)
if not results:
    # No results found
    # → Ask for clarification
    # → Suggest related topics
```

### Embedding Errors
```python
try:
    embedding = qdrant.embed_text(text)
except Exception as e:
    logger.error(f"Embedding failed: {e}")
    # Retry or use fallback
```

## Monitoring & Health

### Health Check Endpoint
```bash
GET /health

Response:
{
    "status": "healthy",
    "services": {
        "qdrant": {
            "status": "healthy",
            "collection": {
                "name": "uniquery",
                "points_count": 12345,
                "vectors_count": 12345,
                "status": "green"
            }
        }
    }
}
```

### Metrics to Track
- Query latency
- Search result count
- Embedding time
- Collection size
- Error rate

## Security

### API Key Protection
```python
# ✅ Stored in environment variables
QDRANT_API_KEY=your-key-here

# ❌ Never in code
api_key = "abc123..."  # DON'T DO THIS
```

### Access Control
- Qdrant API key required for all operations
- No public access to vector database
- Backend acts as secure gateway

## Next Integration Steps

1. **PDF Processing** → Generate chunks for `insert_documents()`
2. **Query Router** → Use `search()` with filters
3. **LLM Integration** → Pass search results as context
4. **Document Management** → Use `delete_by_doc_id()` for updates

---

**Status**: ✅ Qdrant integration complete and production-ready
