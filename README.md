# UniQuery AI

AI-powered academic assistant for universities. Students ask questions, get instant answers from official documents with citations.

## Features

- 🎓 **Academic RAG System** - Retrieval-Augmented Generation for university documents
- 🔍 **Semantic Search** - Qdrant vector database with BGE embeddings
- 🎯 **Metadata Filtering** - Program, department, semester-based routing
- 📚 **Document Management** - Upload, version, and manage academic PDFs
- 👥 **Role-Based Access** - Student and admin dashboards
- 🔐 **Firebase Auth** - Secure authentication and user management
- 📊 **Analytics Dashboard** - Query tracking and usage insights

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Firebase SDK
- React Router

### Backend
- FastAPI (Python)
- Qdrant Cloud (Vector DB)
- BGE-Small-EN (Embeddings)
- Groq (LLM) - Coming soon
- Firebase Admin SDK

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- Qdrant Cloud account (free tier)
- Firebase project

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/uni-query-ai.git
cd uni-query-ai
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env and add your Qdrant credentials

# Test Qdrant connection
python test_qdrant.py

# Start backend
uvicorn app.main:app --reload --port 8000
```

See [backend/QDRANT_SETUP.md](backend/QDRANT_SETUP.md) for detailed Qdrant setup.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure Firebase
# Edit frontend/.env with your Firebase credentials

# Start frontend
npm run dev
```

Visit http://localhost:5173

## Project Structure

```
uni-query-ai/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # App entry point
│   │   ├── config.py       # Configuration
│   │   ├── routers/        # API endpoints
│   │   └── services/       # Business logic
│   ├── test_qdrant.py      # Connection test
│   ├── manage_qdrant.py    # CLI tool
│   └── requirements.txt    # Python deps
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # UI components
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utilities
│   └── package.json       # Node deps
├── uniquery_prd.md        # Product requirements
└── README.md              # This file
```

## Documentation

- [Product Requirements](uniquery_prd.md) - Full PRD with architecture
- [Backend README](backend/README.md) - Backend setup and API docs
- [Qdrant Setup Guide](backend/QDRANT_SETUP.md) - Vector DB configuration
- [Service Documentation](backend/app/services/README.md) - Service API reference

## Development Status

### ✅ Completed
- Frontend UI/UX (Student & Admin dashboards)
- Firebase authentication
- Qdrant Cloud integration
- Vector search with metadata filtering
- Document embedding pipeline
- API structure

### 🚧 In Progress
- PDF processing pipeline
- Groq LLM integration
- RAG query logic
- Document upload to Firebase Storage

### 📋 Planned
- Query logging and analytics
- Document versioning
- Multi-language support
- Voice interaction
- Mobile app

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/health
```

### Authentication
```bash
POST /auth/verify
GET /auth/me
```

### Documents
```bash
GET /documents
POST /documents/upload
DELETE /documents/{id}
```

### Query
```bash
POST /query
```

## Environment Variables

### Backend (.env)
```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key
QDRANT_COLLECTION_NAME=uniquery
GROQ_API_KEY=your-groq-key
```

### Frontend (frontend/.env)
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation in `/backend` and `/frontend`
- Review the PRD: `uniquery_prd.md`
