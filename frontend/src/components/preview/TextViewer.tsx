import { useState, useEffect } from 'react'
import { Download, AlertCircle, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '../ui/Button'

interface TextViewerProps {
  fileUrl: string
  fileName?: string
}

export function TextViewer({ fileUrl, fileName = 'document.txt' }: TextViewerProps) {
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(fileUrl)
        
        if (!response.ok) {
          throw new Error('Failed to fetch file content')
        }
        
        const text = await response.text()
        setContent(text)
      } catch (err) {
        console.error('Error fetching text file:', err)
        setError(err instanceof Error ? err.message : 'Failed to load file')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [fileUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">Failed to Load File</h3>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <a
            href={fileUrl}
            download={fileName}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download File
          </a>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-text-muted">Loading file...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">
            {content.split('\n').length} lines • {content.length} characters
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            title="Copy to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
          
          <a
            href={fileUrl}
            download={fileName}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <pre className="p-6 text-sm font-mono text-text leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    </div>
  )
}
