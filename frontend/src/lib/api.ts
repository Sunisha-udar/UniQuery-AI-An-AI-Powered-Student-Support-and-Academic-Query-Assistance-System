/**
 * API Client for UniQuery Backend
 * Handles all communication with FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('[API] Using API URL:', API_BASE_URL);

// Warm up backend on app load (helps with Render cold starts)
const warmUpBackend = async () => {
  try {
    console.log('[API] Warming up backend...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    await fetch(`${API_BASE_URL}/health`, { 
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timeout);
    console.log('[API] Backend is ready!');
  } catch (error) {
    console.warn('[API] Backend warmup failed (may be sleeping):', error);
  }
};

// Start warming up immediately when module loads
warmUpBackend();

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
    console.log('[API] Querying documents with:', params);
    
    // Add timeout for slow backend
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        signal: controller.signal,
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

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Query failed' }));
        console.error('[API] Query error:', error);
        throw new Error(error.detail || 'Query failed');
      }

      const result = await response.json();
      console.log('[API] Query result:', result);
      return result;
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[API] Query timeout - backend is taking too long');
        throw new Error('Backend is waking up from sleep. Please try again in 30 seconds.');
      }
      console.error('[API] Query failed:', error);
      throw error;
    }
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
