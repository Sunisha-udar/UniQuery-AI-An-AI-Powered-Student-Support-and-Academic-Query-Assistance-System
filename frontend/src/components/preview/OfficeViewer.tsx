import { useState } from 'react'
import { Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'

interface OfficeViewerProps {
  fileUrl: string
  fileName?: string
}

export function OfficeViewer({ fileUrl, fileName = 'document' }: OfficeViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Google Docs Viewer URL
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setError(true)
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Info Banner */}
      <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text">Office Document Preview</p>
            <p className="text-xs text-text-muted">Powered by Google Docs Viewer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border text-text rounded-lg hover:bg-background transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
          
          <a
            href={fileUrl}
            download={fileName}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="relative flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-text-muted">Loading document preview...</p>
              <p className="text-xs text-text-muted mt-1">This may take a moment</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Preview Unavailable</h3>
              <p className="text-sm text-text-muted mb-4">
                Unable to load the document preview. This may happen with very large files or if the document is password-protected.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={fileUrl}
                  download={fileName}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-background transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={googleDocsViewerUrl}
            className="w-full h-full border-0"
            title={`Preview of ${fileName}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
      </div>
    </div>
  )
}
