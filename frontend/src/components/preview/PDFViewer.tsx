import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2, AlertCircle } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface PDFViewerProps {
  fileUrl: string
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageWidth, setPageWidth] = useState<number>(0)
  const [pagesRendered, setPagesRendered] = useState<number>(3) // Reduced to 3 for instant load
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const onDocumentLoadError = (err: Error) => {
    console.error('Error loading PDF:', err)
    setError(err)
    setIsLoading(false)
  }

  // Handle responsive page width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.offsetWidth - 32) // Subtract padding
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && numPages && pagesRendered < numPages) {
          // Load next batch of pages
          setPagesRendered(prev => Math.min(prev + 5, numPages))
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [numPages, pagesRendered])

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden" ref={containerRef}>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-text-muted">Loading document...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-10 w-10 text-error mb-2" />
            <p className="font-medium text-text">Failed to load PDF</p>
            <p className="text-sm text-text-muted mt-1 max-w-sm">
              {error.message || 'Please try downloading the file instead.'}
            </p>
          </div>
        )}

        {!error && (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null} // We handle our own loading UI
            className="flex flex-col items-center gap-4"
          >
            {Array.from(new Array(Math.min(numPages || 0, pagesRendered)), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={pageWidth > 0 ? pageWidth : undefined}
                className="shadow-md"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="h-[800px] w-full bg-surface animate-pulse rounded-md" />
                }
              />
            ))}
          </Document>
        )}

        {/* Sentinel for Infinite Scroll */}
        {numPages && pagesRendered < numPages && (
          <div ref={observerTarget} className="h-20 w-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        )}
      </div>
    </div>
  )
}
