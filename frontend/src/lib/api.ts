/**
 * API Client for UniQuery Backend
 * Handles all communication with FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('[API] Using API URL:', API_BASE_URL);

interface UploadDocumentParams {
  file: File;
  title: string;
  category: string;
}

interface QueryParams {
  question: string;
  program?: string;
  department?: string;
  semester?: number;
  category?: string;
}

interface Citation {
  title: string;
  page: number;
  category: string;
  snippet: string;
  score: number;
}

interface QueryResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
}

interface Document {
  id: string;
  title: string;
  category: string;
  program?: string;
  department?: string;
  semester?: number;
  version: number;
  uploaded_at: string;
  chunk_count: number;
  pdf_url?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  document: {
    id: string;
    title: string;
    category: string;
    program: string;
    department: string;
    semester: number;
    chunk_count: number;
    filename: string;
    pdf_url?: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload a document (PDF, Word, Excel, PowerPoint, Text)
   */
  async uploadDocument(
    file: File,
    title: string,
    category: string = 'general'
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('program', 'All');
    formData.append('department', 'All');
    formData.append('semester', '0');

    const response = await fetch(`${this.baseUrl}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  /**
   * Query documents using RAG pipeline
   */
  async queryDocuments(params: QueryParams): Promise<QueryResponse> {
    const response = await fetch(`${this.baseUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: params.question,
        program: params.program || null,
        department: params.department || null,
        semester: params.semester || null,
        category: params.category || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Query failed' }));
      throw new Error(error.detail || 'Query failed');
    }

    return response.json();
  }

  /**
   * Get list of all documents
   */
  async getDocuments(filters?: {
    category?: string;
    program?: string;
    department?: string;
  }): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.program) params.append('program', filters.program);
    if (filters?.department) params.append('department', filters.department);

    const url = `${this.baseUrl}/api/documents${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  /**
   * Get document download URL
   */
  async getDocumentDownloadUrl(docId: string): Promise<{ pdf_url: string }> {
    const response = await fetch(`${this.baseUrl}/api/documents/${docId}/download`);

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    return response.json();
  }

  /**
   * Delete a document
   */
  async deleteDocument(docId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/documents/${docId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    return response.json();
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ status: string; qdrant_connected: boolean }> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error('Backend is not responding');
    }

    return response.json();
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types
export type {
  UploadDocumentParams,
  QueryParams,
  QueryResponse,
  Citation,
  Document,
  UploadResponse,
};
