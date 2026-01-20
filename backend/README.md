# UniQuery AI - Backend

FastAPI backend for the UniQuery AI academic assistant.

## Features

- ✅ **Qdrant Vector Database** - Semantic search with metadata filtering
- ✅ **BGE Embeddings** - Fast, accurate text embeddings
- 🚧 **Groq LLM** - Coming soon
- 🚧 **Firebase Integration** - Coming soon
- 🚧 **PDF Processing** - Coming soon

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note**: First run will download the embedding model (~130MB). This is cached locally.

### 2. Configure Environment

Copy `.env.example` to `.env` and add your credentials:

```bash
cp ../.env.example .env
```

Edit `.env`:
```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key-here
QDRANT_COLLECTION_NAME=uniquery
```

See [QDRANT_SETUP.md](./QDRANT_SETUP.md) for detailed Qdrant Cloud setup instructions.

### 3. Test Qdrant Connection

```bash
python test_qdrant.py
```

You should see:
```
✓ All tests passed! Qdrant is ready to use.
```

### 4. Start the Server

```bash
uvicorn app.main:app --reload --port 8000
```

Visit:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration management
│   ├── routers/             # API endpoints
│   │   ├── auth.py          # Authentication
│   │   ├── query.py         # RAG queries
│   │   └── documents.py     # Document management
│   └── services/            # Business logic
│       ├── qdrant_service.py  # Vector DB operations
│       └── README.md          # Service documentation
├── test_qdrant.py           # Connection test script
├── manage_qdrant.py         # CLI management tool
├── requirements.txt         # Python dependencies
├── QDRANT_SETUP.md         # Setup guide
└── README.md               # This file
```

## API Endpoints

### Health Check
```bash
GET /health
```

Returns status of all services (Qdrant, etc.)

### Authentication
```bash
POST /auth/verify
GET /auth/me
```

### Documents
```bash
GET /documents              # List documents
GET /documents/{id}         # Get document
POST /documents/upload      # Upload document
```

### Query
```bash
POST /query                 # RAG query endpoint
```

## Management CLI

Use `manage_qdrant.py` to manage the vector database:

```bash
# Show collection info
python manage_qdrant.py info

# Create collection
python manage_qdrant.py create

# Health check
python manage_qdrant.py health

# Test search
python manage_qdrant.py search "attendance policy"

# Delete document
python manage_qdrant.py delete doc_123
```

## Development

### Running Tests

```bash
# Test Qdrant connection
python test_qdrant.py

# Run with pytest (coming soon)
pytest
```

### Code Style

```bash
# Format code
black app/

# Lint
flake8 app/

# Type check
mypy app/
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `QDRANT_URL` | Qdrant Cloud cluster URL | ✅ |
| `QDRANT_API_KEY` | Qdrant API key | ✅ |
| `QDRANT_COLLECTION_NAME` | Collection name (default: uniquery) | ❌ |
| `EMBEDDING_MODEL` | HuggingFace model (default: BAAI/bge-small-en-v1.5) | ❌ |
| `GROQ_API_KEY` | Groq API key | 🚧 |
| `FIREBASE_PROJECT_ID` | Firebase project ID | 🚧 |

## Troubleshooting

### "Connection refused" error

- Check your Qdrant URL and API key in `.env`
- Verify your cluster is running in Qdrant Cloud dashboard

### "Module not found" error

- Make sure you installed dependencies: `pip install -r requirements.txt`
- Activate your virtual environment if using one

### Slow first startup

- The embedding model downloads on first run (~130MB)
- This is cached and won't download again

### "Out of memory" error

- The embedding model requires ~500MB RAM
- Close other applications or use a machine with more RAM

## Next Steps

- [ ] Implement PDF processing pipeline
- [ ] Add Groq LLM integration
- [ ] Connect Firebase Admin SDK
- [ ] Build RAG query logic
- [ ] Add query logging
- [ ] Implement document versioning

## Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [BGE Embeddings](https://huggingface.co/BAAI/bge-small-en-v1.5)
- [Groq API](https://console.groq.com/)

## License

MIT
