import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { getSignedUrl, type Bucket } from '@/lib/storage'

/** Renders an image stored in a private Supabase bucket by resolving a fresh signed URL. */
export function StorageImage({ bucket, path, alt = '', className }: { bucket: Bucket; path: string; alt?: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setUrl(null)
    getSignedUrl(bucket, path).then((signed) => {
      if (active) setUrl(signed)
    })
    return () => {
      active = false
    }
  }, [bucket, path])

  if (!url) return <div className={clsx('animate-pulse bg-[var(--surface-muted)]', className)} />
  return <img src={url} alt={alt} className={className} />
}
