import { type CSSProperties, useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface PDFViewerProps {
  fileUrl: string
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const { theme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Simulate loading for desktop or handle iframe load
  useEffect(() => {
    if (!isMobile) {
      // For desktop object tag, we can't easily detect load, so we use a timeout
      // to show the spinner for a reasonable amount of time to indicate processing
      const timer = setTimeout(() => setIsLoading(false), 1500)
      return () => clearTimeout(timer)
    } else {
      // Reset loading when switching to mobile view (iframe will handle its own load event)
      setIsLoading(true)
    }
  }, [isMobile, fileUrl])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  if (isMobile) {
    const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

    return (
      <div className="flex h-full w-full flex-col bg-background relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={googleDocsViewerUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
            sandbox="allow-scripts allow-same-origin allow-popups"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-background relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <object
          data={fileUrl}
          type="application/pdf"
          className="h-full w-full"
          aria-label="PDF document viewer"
          style={{ colorScheme: `only ${theme}` } as CSSProperties}
        >
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your browser doesn't support embedded PDFs. Please download the file to view it.
              </p>
            </div>
          </div>
        </object>
      </div>
    </div>
  )
}
