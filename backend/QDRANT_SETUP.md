# Qdrant Cloud Setup Guide

This guide will help you set up Qdrant Cloud for UniQuery AI.

## Step 1: Create Qdrant Cloud Account

1. Go to [https://cloud.qdrant.io/](https://cloud.qdrant.io/)
2. Sign up for a free account
3. Verify your email

## Step 2: Create a Cluster

1. Click "Create Cluster" in the dashboard
2. Choose the **Free Tier** option:
   - 1GB storage
   - Shared resources
   - Perfect for development and testing
3. Select a region closest to your users
4. Give your cluster a name (e.g., "uniquery-dev")
5. Click "Create"

Wait a few minutes for the cluster to be provisioned.

## Step 3: Get Your Credentials

Once your cluster is ready:

1. Click on your cluster name
2. You'll see:
   - **Cluster URL**: Something like `https://abc123-xyz.qdrant.io`
   - **API Key**: Click "Show" to reveal it

## Step 4: Configure Environment Variables

1. Copy the `.env.example` file to `.env` in the backend directory:
   ```bash
   cd backend
   cp ../.env.example .env
   ```

2. Edit the `.env` file and add your Qdrant credentials:
   ```env
   QDRANT_URL=https://your-cluster-url.qdrant.io
   QDRANT_API_KEY=your-api-key-here
   QDRANT_COLLECTION_NAME=uniquery
   ```

## Step 5: Install Dependencies

Install the required Python packages:

```bash
cd backend
pip install -r requirements.txt
```

**Note**: The first time you run this, it will download the `bge-small-en-v1.5` embedding model (~130MB). This is normal and only happens once.

## Step 6: Test the Connection

Run the test script to verify everything is working:

```bash
cd backend
python test_qdrant.py
```

You should see output like:
```
============================================================
UniQuery AI - Qdrant Connection Test
============================================================

✓ Settings loaded
  - Qdrant URL: https://your-cluster.qdrant.io
  - Collection: uniquery
  - Embedding Model: BAAI/bge-small-en-v1.5

⏳ Initializing Qdrant service...
✓ Qdrant service initialized

⏳ Checking Qdrant connection...
✓ Qdrant connection healthy

⏳ Creating/verifying collection...
✓ Collection ready

...

✓ All tests passed! Qdrant is ready to use.
============================================================
```

## Step 7: Start the Backend

Once the test passes, start the FastAPI server:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/health` to verify all services are running.

## Troubleshooting

### Error: "Connection refused" or "Timeout"

- Check that your Qdrant URL is correct
- Verify your API key is valid
- Ensure your cluster is in "Running" state in the Qdrant dashboard

### Error: "Invalid API key"

- Double-check you copied the full API key
- Make sure there are no extra spaces in the `.env` file

### Error: "Module not found"

- Make sure you installed all dependencies: `pip install -r requirements.txt`
- Activate your virtual environment if you're using one

### Embedding model download is slow

- The first run downloads ~130MB for the embedding model
- This is cached locally and won't download again
- Be patient, it's a one-time setup

## Free Tier Limits

Qdrant Cloud Free Tier includes:
- **1GB storage** (~1-2 million document chunks)
- **Unlimited requests** (rate-limited)
- **Shared resources**

This is more than enough for a university deployment with thousands of documents.

## Next Steps

Once Qdrant is set up:
1. ✅ Qdrant connection working
2. ⏭️ Implement PDF processing pipeline
3. ⏭️ Add Groq LLM integration
4. ⏭️ Build RAG query logic

---

**Need help?** Check the [Qdrant documentation](https://qdrant.tech/documentation/) or open an issue.
