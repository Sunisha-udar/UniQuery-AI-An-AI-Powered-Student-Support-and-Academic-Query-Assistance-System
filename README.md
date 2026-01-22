# UniQuery AI

AI-powered academic assistant for universities.

## What it is?
UniQuery AI is a specialized academic assistant designed to help university students get instant, accurate information from official documents.

## What it does?
- Provides instant answers to academic queries.
- Sources information directly from official university PDFs (syllabi, handbooks, etc.).
- Includes precise citations and references for every answer.
- Offers role-based dashboards for students and administrators.

## How it works?
The system utilizes **Retrieval-Augmented Generation (RAG)**:
1. **Documents** are processed and stored as vector embeddings in Qdrant.
2. **Student queries** are embedded and used to search for relevant document sections.
3. **LLM (Groq)** generates responses based on the retrieved context, ensuring accuracy and relevance.
4. **Firebase** handles user authentication and document metadata management.

## Tech Stack

### Frontend
- **React 19 + TypeScript**
- **Vite**
- **Tailwind CSS 4**
- **Firebase SDK**

### Backend
- **FastAPI (Python)**
- **Qdrant Cloud** (Vector DB)
- **BGE-Small-EN** (Embeddings)
- **Groq** (LLM)
- **Firebase Admin SDK**
