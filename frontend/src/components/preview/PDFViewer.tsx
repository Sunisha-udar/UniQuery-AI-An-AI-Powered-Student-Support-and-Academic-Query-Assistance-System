import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Download, Loader2, Minus, Plus } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface PDFViewerProps {
  fileUrl: string
  fileName?: string
}

const workerFile = pdfjs.version.startsWith('4.')
  ? 'pdf.worker.min.mjs'
  : 'pdf.worker.min.js'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/${workerFile}`

export function PDFViewer({ fileUrl, fileName = 'document.pdf' }: PDFViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef(new Map<number, HTMLDivElement>())

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [containerWidth, setContainerWidth] = useState(720)
  const [isMobile, setIsMobile] = useState(false)
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set([1, 2, 3]))

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const updateMobileState = () => setIsMobile(mediaQuery.matches)

    updateMobileState()
    mediaQuery.addEventListener('change', updateMobileState)

    return () => mediaQuery.removeEventListener('change', updateMobileState)
  }, [])

  useEffect(() => {
    if (!viewerRef.current) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 720
      setContainerWidth(nextWidth)
    })

    resizeObserver.observe(viewerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  const basePageWidth = useMemo(() => {
    const gutter = isMobile ? 24 : 96
    const baseWidth = Math.max(280, containerWidth - gutter)

    return Math.min(baseWidth, 2200)
  }, [containerWidth, isMobile])

  const baseEstimatedPageHeight = useMemo(() => Math.floor(basePageWidth * 1.35), [basePageWidth])
  const scaledPageWidth = useMemo(() => Math.floor(basePageWidth * zoom), [basePageWidth, zoom])
  const scaledPageHeight = useMemo(() => Math.floor(baseEstimatedPageHeight * zoom), [baseEstimatedPageHeight, zoom])

  useEffect(() => {
    const root = viewerRef.current

    if (!root || numPages < 1) {
      return
    }

    const pageNodes = Array.from(pageRefs.current.values())

    if (pageNodes.length < 1) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestPage: number | null = null
        let bestRatio = 0

        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          const pageFromDom = Number((entry.target as HTMLElement).dataset.pageNumber)

          if (Number.isNaN(pageFromDom)) {
            return
          }

          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            bestPage = pageFromDom
          }

          setRenderedPages((prev) => {
            const next = new Set(prev)
            const minPage = Math.max(1, pageFromDom - 1)
            const maxPage = Math.min(numPages, pageFromDom + 1)

            for (let page = minPage; page <= maxPage; page += 1) {
              next.add(page)
            }

            if (next.size === prev.size) {
              return prev
            }

            return next
          })
        })

        if (bestPage !== null) {
          setCurrentPage(bestPage)
        }
      },
      {
        root,
        rootMargin: '450px 0px',
        threshold: [0.01, 0.2, 0.5, 0.75, 0.95],
      },
    )

    pageNodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [numPages, basePageWidth])

  const handleDocumentLoad = ({ numPages: loadedPages }: { numPages: number }) => {
    setIsLoading(false)
    setError(null)
    setNumPages(loadedPages)
    setCurrentPage(1)
    setRenderedPages(new Set([1, 2, 3]))
  }

  const handleDocumentError = () => {
    setIsLoading(false)
    setError('Failed to load PDF. The file may be corrupted or incompatible.')
  }

  const registerPageRef = (pageNumber: number) => (node: HTMLDivElement | null) => {
    if (node) {
      pageRefs.current.set(pageNumber, node)
      return
    }

    pageRefs.current.delete(pageNumber)
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      {error ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
              <AlertCircle className="h-8 w-8 text-error" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-text">Failed to Load PDF</h3>
            <p className="mb-4 text-sm text-text-muted">{error}</p>
            <div className="flex justify-center gap-3">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:px-4">
            <div className="text-sm text-text">
              Page {currentPage} / {numPages || '-'}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.6))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="min-w-14 text-center text-sm text-text">{Math.round(zoom * 100)}%</span>

              <button
                onClick={() => setZoom((prev) => Math.min(prev + 0.1, 3))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>

              <a
                href={fileUrl}
                download={fileName}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text hover:bg-surface sm:w-auto sm:gap-2 sm:px-3"
                aria-label="Download PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">Download</span>
              </a>
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80">
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-text-muted">Loading PDF...</p>
              </div>
            </div>
          )}

          <div ref={viewerRef} className="h-full overflow-auto bg-[#eef1f4] p-2 sm:p-6">
            <Document
              file={fileUrl}
              onLoadSuccess={handleDocumentLoad}
              onLoadError={handleDocumentError}
              loading=""
            >
              <div className="mx-auto w-fit">
                {Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1
                  const shouldRenderPage = renderedPages.has(pageNum)

                  return (
                    <div
                      key={pageNum}
                      ref={registerPageRef(pageNum)}
                      data-page-number={pageNum}
                      className="mb-4 overflow-hidden rounded-lg border border-border bg-white shadow-sm last:mb-0"
                      style={{ minHeight: scaledPageHeight, width: scaledPageWidth }}
                    >
                      {shouldRenderPage ? (
                        <div
                          style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            width: basePageWidth,
                            transition: 'transform 140ms ease-out',
                            willChange: 'transform',
                          }}
                        >
                          <Page
                            pageNumber={pageNum}
                            width={basePageWidth}
                            renderTextLayer
                            renderAnnotationLayer
                            loading={
                              <div className="flex h-24 items-center justify-center text-sm text-text-muted">
                                Loading page {pageNum}...
                              </div>
                            }
                          />
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center text-sm text-text-muted"
                          style={{ height: scaledPageHeight, width: scaledPageWidth }}
                        >
                          Preparing page {pageNum}...
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Document>
          </div>
        </div>
      )}
    </div>
  )
}
