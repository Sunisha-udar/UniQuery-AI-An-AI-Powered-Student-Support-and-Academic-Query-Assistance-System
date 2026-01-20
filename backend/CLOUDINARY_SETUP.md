# Cloudinary Setup Guide

## Why Cloudinary?

Cloudinary provides a generous free tier for PDF storage:
- **25GB storage** (enough for thousands of PDFs)
- **25GB bandwidth/month**
- No credit card required for free tier
- Fast CDN delivery
- Simple API

## Setup Steps

### 1. Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Sign up with your email (no credit card needed)
3. Verify your email

### 2. Get Your Credentials

1. After login, go to Dashboard: [https://console.cloudinary.com/](https://console.cloudinary.com/)
2. You'll see your credentials in the "Account Details" section:
   - **Cloud Name**: e.g., `dxxxxx`
   - **API Key**: e.g., `123456789012345`
   - **API Secret**: e.g., `abcdefghijklmnopqrstuvwxyz`

### 3. Add Credentials to .env

Open `backend/.env` and add your credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 4. Test the Integration

Run the test script:

```bash
cd backend
python test_cloudinary.py
```

## Features Implemented

### 1. PDF Upload
- PDFs are uploaded to Cloudinary after processing
- Stored in `uniquery/pdfs/` folder
- Metadata (title, category, program) stored with each file
- Returns secure HTTPS URL

### 2. PDF Download
- Get download URL: `GET /api/documents/{doc_id}/download`
- Returns secure CDN URL for fast downloads

### 3. PDF Deletion
- Delete PDF: `DELETE /api/documents/{doc_id}`
- Removes from both Cloudinary and Qdrant

### 4. List PDFs
- Service method to list all uploaded PDFs
- Supports pagination

## API Endpoints

### Upload Document
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

file: <PDF file>
title: "CSE Syllabus 2024"
category: "syllabus"
program: "B.Tech"
department: "CSE"
semester: 5
```

Response:
```json
{
  "success": true,
  "message": "Document 'CSE Syllabus 2024' processed successfully",
  "document": {
    "id": "doc_abc123",
    "title": "CSE Syllabus 2024",
    "chunk_count": 24,
    "pdf_url": "https://res.cloudinary.com/your-cloud/raw/upload/v123/uniquery/pdfs/doc_abc123.pdf"
  }
}
```

### Download Document
```bash
GET /api/documents/{doc_id}/download
```

Response:
```json
{
  "success": true,
  "doc_id": "doc_abc123",
  "pdf_url": "https://res.cloudinary.com/your-cloud/raw/upload/v123/uniquery/pdfs/doc_abc123.pdf"
}
```

### Delete Document
```bash
DELETE /api/documents/{doc_id}
```

Response:
```json
{
  "success": true,
  "message": "Document doc_abc123 deleted successfully"
}
```

## Storage Architecture

```
User uploads PDF
    ↓
FastAPI receives file
    ↓
PDF Service extracts text & creates chunks
    ↓
Qdrant Service stores embeddings (for search)
    ↓
Cloudinary Service uploads original PDF (for download)
    ↓
Return success with PDF URL
```

## Free Tier Limits

- **Storage**: 25GB (≈ 25,000 PDFs at 1MB each)
- **Bandwidth**: 25GB/month
- **Transformations**: 25 credits/month (not needed for PDFs)
- **Requests**: Unlimited

## Cost Estimation

For a university with 1000 students:
- Average 100 PDFs uploaded (100MB total)
- Average 1000 downloads/month (100MB bandwidth)
- **Cost**: FREE (well within limits)

## Security

- All URLs are HTTPS (secure)
- API keys stored in .env (not in code)
- Signed URLs can be enabled for private access
- Access control via FastAPI endpoints

## Next Steps

After Cloudinary setup:
1. ✅ Cloudinary integration (DONE)
2. 🔄 Groq LLM integration (NEXT)
3. 🔄 RAG pipeline (query → search → generate answer)
4. 🔄 Frontend integration
