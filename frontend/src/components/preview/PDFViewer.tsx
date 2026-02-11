import type { CSSProperties } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface PDFViewerProps {
  fileUrl: string
}

export function PDFViewer({ fileUrl }: PDFViewerProps) {
  const { theme } = useTheme()

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex-1 overflow-hidden">
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
