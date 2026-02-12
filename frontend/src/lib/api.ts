/**
 * API Client for UniQuery Backend
 * Handles all communication with FastAPI backend
 */

// Smart API URL detection for mobile/ngrok support
const getApiBaseUrl = (): string => {
  // 1. Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const currentHost = window.location.hostname;

  // 2. If running on ngrok (mobile testing), use same origin
  if (currentHost.includes('ngrok')) {
    const apiUrl = `${window.location.protocol}//${window.location.host}`;
    console.log('[API] Detected ngrok environment, using:', apiUrl);
    return apiUrl;
  }

  // 3. If accessing via local network IP (mobile on same network)
  if (currentHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // Return empty string to use relative path (proxied by Vite)
    console.log('[API] Detected local network IP, using relative path (via proxy)');
    return '';
  }

  // 4. If in production (vercel/deployed), use same origin
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    const apiUrl = `${window.location.protocol}//${window.location.host}`;
    console.log('[API] Detected production environment, using:', apiUrl);
    return apiUrl;
  }

  // 5. Default to localhost for local development
  console.log('[API] Using localhost for development');
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[API] Final API URL:', API_BASE_URL);

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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  program?: string;
  department?: string;
  semester?: number;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
}

interface CreateFAQRequest {
  question: string;
  answer: string;
  category: string;
  program?: string;
  department?: string;
  semester?: number;
  is_pinned?: boolean;
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
      const response = await fetch(`${this.baseUrl}/api/query/`, {
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

    const url = `${this.baseUrl}/api/documents/${params.toString() ? '?' + params.toString() : ''}`;
    console.log('[API] Fetching documents from:', url);

    try {
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[API] Documents fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[API] Documents fetched successfully:', data.length, 'documents');
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[API] Network error - check if backend is reachable:', this.baseUrl);
        throw new Error(`Cannot reach backend at ${this.baseUrl}. Check your VITE_API_URL configuration.`);
      }
      throw error;
    }
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
   * Rename a document
   */
  async renameDocument(docId: string, newTitle: string): Promise<{ success: boolean; message: string; can_undo: boolean; history_id: string | null }> {
    const formData = new FormData();
    formData.append('new_title', newTitle);

    const response = await fetch(`${this.baseUrl}/api/documents/${docId}/rename`, {
      method: 'PATCH',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to rename document' }));
      throw new Error(error.detail || 'Failed to rename document');
    }

    return response.json();
  }

  /**
   * Undo the last rename operation
   */
  async undoRename(docId: string): Promise<{ success: boolean; message: string; reverted_to: string }> {
    const response = await fetch(`${this.baseUrl}/api/documents/${docId}/undo-rename`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to undo rename' }));
      throw new Error(error.detail || 'Failed to undo rename');
    }

    return response.json();
  }

  /**
   * Get rename history for a document
   */
  async getRenameHistory(docId: string, limit: number = 10): Promise<{ success: boolean; history: any[]; can_undo: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/documents/${docId}/rename-history?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to get rename history');
    }

    return response.json();
  }

  /**
   * Check if a manual answer exists
   */
  async checkManualAnswer(question: string, token?: string): Promise<{ exists: boolean; answer?: string; doc_id?: string; category?: string; program?: string; department?: string; semester?: number }> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/documents/manual-answer/check?question=${encodeURIComponent(question)}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      // Return false if not found or error
      return { exists: false };
    }

    return response.json();
  }

  /**
   * Submit a manual answer
   */
  async submitManualAnswer(
    data: {
      question: string;
      answer: string;
      category: string;
      program: string;
      department: string;
      semester: number;
    },
    doc_id?: string | null,
    token?: string
  ): Promise<{ success: boolean; message: string }> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = { ...data, doc_id };

    const response = await fetch(`${this.baseUrl}/api/documents/manual-answer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to submit manual answer' }));
      throw new Error(error.detail || 'Failed to submit manual answer');
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
  async checkHealth(): Promise<{ status: string; qdrant_connected: boolean; database_connected: boolean; latency?: number }> {
    const response = await fetch(`${this.baseUrl}/health?t=${Date.now()}`);

    if (!response.ok) {
      throw new Error('Backend is not responding');
    }

    return response.json();
  }

  /**
   * Get all FAQs with optional filtering
   */
  async getFAQs(filters?: {
    category?: string;
    program?: string;
    department?: string;
    limit?: number;
  }): Promise<FAQItem[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.program) params.append('program', filters.program);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${this.baseUrl}/api/faqs/${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch FAQs');
    }

    return response.json();
  }

  /**
   * Get popular questions from chat history
   */
  async getPopularQuestions(limit: number = 10): Promise<{ question: string; count: number }[]> {
    const response = await fetch(`${this.baseUrl}/api/faqs/popular?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch popular questions');
    }

    return response.json();
  }

  /**
   * Get FAQ categories
   */
  async getFAQCategories(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/faqs/categories`);

    if (!response.ok) {
      throw new Error('Failed to fetch FAQ categories');
    }

    return response.json();
  }

  /**
   * Create a new FAQ (Admin only)
   */
  async createFAQ(faq: CreateFAQRequest, token?: string): Promise<FAQItem> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/faqs/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(faq),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create FAQ' }));
      throw new Error(error.detail || 'Failed to create FAQ');
    }

    return response.json();
  }

  /**
   * Update an FAQ (Admin only)
   */
  async updateFAQ(faqId: string, updates: Partial<CreateFAQRequest>, token?: string): Promise<FAQItem> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/faqs/${faqId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update FAQ' }));
      throw new Error(error.detail || 'Failed to update FAQ');
    }

    return response.json();
  }

  /**
   * Delete an FAQ (Admin only)
   */
  async deleteFAQ(faqId: string, token?: string): Promise<{ success: boolean; message: string }> {
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/faqs/${faqId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete FAQ');
    }

    return response.json();
  }

  /**
   * Increment FAQ view count
   */
  async incrementFAQView(faqId: string): Promise<{ success: boolean; view_count: number }> {
    const response = await fetch(`${this.baseUrl}/api/faqs/${faqId}/increment-view`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to increment FAQ view');
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
  FAQItem,
  CreateFAQRequest,
};
