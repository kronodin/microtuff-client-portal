import * as path from 'path'

export const ALLOWED = {
  document: {
    ext: ['.pdf', '.doc', '.docx'],
    mime: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    max: Number(process.env.MAX_DOC_IMAGE_BYTES) || 10485760,
  },
  image: {
    ext: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mime: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    max: Number(process.env.MAX_DOC_IMAGE_BYTES) || 10485760,
  },
  video: {
    ext: ['.mp4', '.mov', '.avi'],
    mime: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    max: Number(process.env.MAX_VIDEO_BYTES) || 104857600,
  },
}

export type FileType = keyof typeof ALLOWED

export function classifyFile(filename: string, mime?: string | null): FileType | null {
  const lower = filename.toLowerCase()
  const ext = path.extname(lower)
  const entries = Object.entries(ALLOWED) as [FileType, { ext: string[]; mime: string[]; max: number }][]
  for (const [type, cfg] of entries) {
    if (cfg.ext.includes(ext) || (mime && cfg.mime.includes(mime))) return type
  }
  return null
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 120)
}

// Each client gets their own project folder, keyed by phone so files are
// easy to locate on disk: uploads/<phone>/
export function clientDirFor(phone: string): string {
  const safe = phone.replace(/[^a-zA-Z0-9]/g, '_')
  return path.resolve(process.env.UPLOAD_DIR || './uploads', safe)
}
