import { useState } from 'react'

interface UploadOptions {
  bucket?: string
  folder?: string
}

interface UploadState {
  uploading: boolean
  error: string | null
}

/**
 * Upload an image file via /api/upload (Supabase Storage or data URL fallback).
 * Returns the public URL of the uploaded image.
 */
export function useImageUpload(options: UploadOptions = {}) {
  const [state, setState] = useState<UploadState>({ uploading: false, error: null })

  const upload = async (file: File): Promise<string | null> => {
    setState({ uploading: true, error: null })
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (options.bucket) fd.append('bucket', options.bucket)
      if (options.folder) fd.append('folder', options.folder)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || json.error) {
        setState({ uploading: false, error: json.error ?? 'Upload failed' })
        return null
      }

      setState({ uploading: false, error: null })
      return json.url as string
    } catch (err) {
      setState({ uploading: false, error: 'Upload failed' })
      return null
    }
  }

  return { upload, ...state }
}
