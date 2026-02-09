import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'

interface ImageViewerProps {
  fileUrl: string
  fileName?: string
}

export function ImageViewer({ fileUrl, fileName = 'image' }: ImageViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 400))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(100)
    setRotation(0)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setError(true)
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">Failed to Load Image</h3>
          <p className="text-sm text-text-muted mb-4">The image could not be loaded. It may be corrupted or in an unsupported format.</p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Image
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 p-4 border-b border-border bg-background">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 25}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <div className="px-4 py-1 bg-surface border border-border rounded-lg min-w-[80px] text-center">
          <span className="text-sm font-medium text-text">{zoom}%</span>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 400}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <Button
          variant="secondary"
          size="sm"
          onClick={handleRotate}
          title="Rotate"
        >
          <RotateCw className="w-4 h-4" />
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <a
          href={fileUrl}
          download={fileName}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>

      {/* Image Container */}
      <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-8">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-text-muted">Loading image...</p>
            </div>
          </div>
        )}

        <div
          className="transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <img
            src={fileUrl}
            alt={fileName}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="max-w-full max-h-full object-contain shadow-2xl"
            style={{
              display: isLoading ? 'none' : 'block',
            }}
          />
        </div>
      </div>
    </div>
  )
}
