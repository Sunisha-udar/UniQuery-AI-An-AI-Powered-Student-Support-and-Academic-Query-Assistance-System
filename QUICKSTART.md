# UniQuery AI - Quick Start Guide

Get UniQuery AI running in 10 minutes.

## Step 1: Get Qdrant Cloud Credentials (5 min)

1. Go to https://cloud.qdrant.io/
2. Sign up for free
3. Create a cluster (Free Tier)
4. Copy your:
   - Cluster URL (e.g., `https://abc123.qdrant.io`)
   - API Key (click "Show" to reveal)

## Step 2: Setup Backend (3 min)

```bash
# Navigate to backend
cd backend

# Install dependencies (first run downloads ~130MB embedding model)
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env

# Edit .env and add your Qdrant credentials:
# QDRANT_URL=https://your-cluster.qdrant.io
# QDRANT_API_KEY=your-api-key-here
```

**Windows PowerShell users can run:**
```powershell
.\setup.ps1
```

## Step 3: Test Connection (1 min)

```bash
python test_qdrant.py
```

You should see:
```
✓ All tests passed! Qdrant is ready to use.
```

## Step 4: Start Backend (30 sec)

```bash
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/health - you should see:
```json
{
  "status": "healthy",
  "services": {
    "qdrant": {
      "status": "healthy",
      "collection": {...}
    }
  }
}
```

## Step 5: Setup Frontend (Optional - 2 min)

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Configure Firebase (edit frontend/.env)
# Add your Firebase credentials

# Start frontend
npm run dev
```

Visit http://localhost:5173

## Troubleshooting

### Backend won't start
- Check `.env` file has correct Qdrant credentials
- Verify Qdrant cluster is running in dashboard
- Make sure port 8000 is not in use

### "Module not found" error
- Run `pip install -r requirements.txt` again
- Check you're in the `backend` directory

### Slow first startup
- The embedding model downloads on first run (~130MB)
- This is normal and only happens once

## Next Steps

Now that Qdrant is connected:

1. ✅ Qdrant vector database working
2. ⏭️ Implement PDF processing
3. ⏭️ Add Groq LLM integration
4. ⏭️ Build RAG query pipeline

## Useful Commands

```bash
# Backend management
cd backend

# Show collection info
python manage_qdrant.py info

# Test search
python manage_qdrant.py search "attendance"

# Health check
python manage_qdrant.py health

# Start server
uvicorn app.main:app --reload
```

## Documentation

- [Full README](README.md)
- [Backend Setup](backend/README.md)
- [Qdrant Setup Guide](backend/QDRANT_SETUP.md)
- [Product Requirements](uniquery_prd.md)

## Need Help?

- Check the [Qdrant Setup Guide](backend/QDRANT_SETUP.md)
- Review [Backend README](backend/README.md)
- Open an issue on GitHub
