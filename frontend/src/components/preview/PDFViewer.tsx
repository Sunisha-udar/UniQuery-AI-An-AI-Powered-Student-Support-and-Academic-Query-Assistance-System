import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PDFViewerProps {
  fileUrl: string
  fileName?: string
}

// Lightweight PDF viewer using browser's native PDF renderer
// No dependencies needed - faster builds and deployments
export function PDFViewer({ fileUrl, fileName = 'document.pdf' }: PDFViewerProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const updateMobileState = () => setIsMobile(mediaQuery.matches)
    
    updateMobileState()
    mediaQuery.addEventListener('change', updateMobileState)
    
    return () => mediaQuery.removeEventListener('change', updateMobileState)
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with download button */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {fileName}
        </h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          aria-label="Download PDF"
        >
          <Download className="h-4 w-4" />
          {!isMobile && <span>Download</span>}
        </button>
      </div>

      {/* PDF viewer using browser's native renderer */}
      <div className="flex-1 overflow-hidden">
        <object
          data={fileUrl}
          type="application/pdf"
          className="h-full w-full"
          aria-label="PDF document viewer"
        >
          {/* Fallback for browsers without PDF plugin */}
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Your browser doesn't support embedded PDFs.
              </p>
              <button
                onClick={handleDownload}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>
        </object>
      </div>
    </div>
  )
}
