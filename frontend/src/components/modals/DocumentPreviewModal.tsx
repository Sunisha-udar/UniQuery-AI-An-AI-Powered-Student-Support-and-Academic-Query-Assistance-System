import { useEffect, useState } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { Modal, ModalHeader, ModalBody } from '../ui/Modal'
import { PDFViewer } from '../preview/PDFViewer'
import { ImageViewer } from '../preview/ImageViewer'
import { OfficeViewer } from '../preview/OfficeViewer'
import { TextViewer } from '../preview/TextViewer'
import { getViewerType, getFileTypeName } from '../../lib/utils/fileTypeDetector'
import type { Document } from '../../lib/api'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  doc: Document | null
}

export function DocumentPreviewModal({ isOpen, onClose, doc }: DocumentPreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!doc?.pdf_url) return

    try {
      setIsDownloading(true)
      const response = await fetch(doc.pdf_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.title || 'document'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!doc || !isOpen) return null

  const fileUrl = doc.pdf_url
  const fileName = doc.title

  if (!fileUrl) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader onClose={onClose}>
          <h2 className="text-lg font-semibold text-text">Document Preview</h2>
        </ModalHeader>
        <ModalBody>
          <div className="py-12 text-center">
            <p className="text-text-muted">No file URL available for this document.</p>
          </div>
        </ModalBody>
      </Modal>
    )
  }

  const viewerType = getViewerType(fileUrl)
  const fileTypeName = getFileTypeName(fileUrl)

  const renderViewer = () => {
    switch (viewerType) {
      case 'pdf':
        return <PDFViewer fileUrl={fileUrl} fileName={fileName} />

      case 'image':
        return <ImageViewer fileUrl={fileUrl} fileName={fileName} />

      case 'office':
        return <OfficeViewer fileUrl={fileUrl} fileName={fileName} />

      case 'text':
        return <TextViewer fileUrl={fileUrl} fileName={fileName} />

      default:
        return (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text">Preview Not Available</h3>
              <p className="mb-4 text-sm text-text-muted">
                This file type ({fileTypeName}) cannot be previewed in the browser.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Downloading...' : 'Download File'}
                </button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-text transition-colors hover:bg-background"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-full w-full items-center justify-center p-0 sm:p-4">
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-surface shadow-2xl sm:max-h-[95vh] sm:max-w-7xl sm:rounded-xl">
          <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-text sm:text-lg">{fileName}</h2>
              <div className="mt-1 flex items-center gap-3 overflow-hidden text-xs text-text-muted">
                <span className="truncate">{fileTypeName}</span>
                {doc.program && <span className="hidden truncate sm:inline">{doc.program}</span>}
                {doc.department && <span className="hidden truncate sm:inline">{doc.department}</span>}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                title="Download"
              >
                <Download className="h-4 w-4" />
                <span className="hidden md:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">{renderViewer()}</div>
        </div>
      </div>
    </div>
  )
}
