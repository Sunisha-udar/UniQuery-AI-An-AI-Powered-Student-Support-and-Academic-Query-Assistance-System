/**
 * File Type Detector Utility
 * Determines the appropriate viewer type based on file extension or URL
 */

export type ViewerType = 'pdf' | 'image' | 'office' | 'text' | 'unknown'

export interface FileTypeInfo {
  viewerType: ViewerType
  extension: string
  mimeType?: string
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
const PDF_EXTENSIONS = ['pdf']
const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
const TEXT_EXTENSIONS = ['txt', 'md', 'csv', 'json', 'xml', 'log']

/**
 * Get file extension from filename or URL
 */
export function getFileExtension(fileNameOrUrl: string): string {
  // Remove query parameters and hash
  const cleanUrl = fileNameOrUrl.split('?')[0].split('#')[0]
  
  // Extract extension
  const parts = cleanUrl.split('.')
  if (parts.length < 2) return ''
  
  return parts[parts.length - 1].toLowerCase()
}

/**
 * Determine the viewer type based on file extension
 */
export function getViewerType(fileNameOrUrl: string): ViewerType {
  const extension = getFileExtension(fileNameOrUrl)
  
  if (PDF_EXTENSIONS.includes(extension)) {
    return 'pdf'
  }
  
  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'image'
  }
  
  if (OFFICE_EXTENSIONS.includes(extension)) {
    return 'office'
  }
  
  if (TEXT_EXTENSIONS.includes(extension)) {
    return 'text'
  }
  
  return 'unknown'
}

/**
 * Get detailed file type information
 */
export function getFileTypeInfo(fileNameOrUrl: string): FileTypeInfo {
  const extension = getFileExtension(fileNameOrUrl)
  const viewerType = getViewerType(fileNameOrUrl)
  
  // Map extensions to MIME types
  const mimeTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
  }
  
  return {
    viewerType,
    extension,
    mimeType: mimeTypeMap[extension],
  }
}

/**
 * Check if file type is supported for preview
 */
export function isPreviewSupported(fileNameOrUrl: string): boolean {
  const viewerType = getViewerType(fileNameOrUrl)
  return viewerType !== 'unknown'
}

/**
 * Get user-friendly file type name
 */
export function getFileTypeName(fileNameOrUrl: string): string {
  const extension = getFileExtension(fileNameOrUrl)
  
  const nameMap: Record<string, string> = {
    pdf: 'PDF Document',
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    png: 'PNG Image',
    gif: 'GIF Image',
    bmp: 'Bitmap Image',
    webp: 'WebP Image',
    svg: 'SVG Image',
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    ppt: 'PowerPoint Presentation',
    pptx: 'PowerPoint Presentation',
    txt: 'Text File',
    md: 'Markdown File',
    csv: 'CSV File',
    json: 'JSON File',
    xml: 'XML File',
  }
  
  return nameMap[extension] || `${extension.toUpperCase()} File`
}
