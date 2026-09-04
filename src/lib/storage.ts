import { supabase } from './supabase'

export type Bucket = 'crop-images' | 'soil-images' | 'voice-notes'

/** Uploads a file under the owner's folder (required by the storage RLS policies) and returns its storage path. */
export async function uploadToBucket(bucket: Bucket, userId: string, file: File): Promise<string | null> {
  const path = `${userId}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from(bucket).upload(path, file)
  if (error || !data) return null
  return data.path
}

/**
 * These buckets are private (RLS-protected), so `getPublicUrl` would return a URL that
 * 403s. A signed URL is required to actually render the image, and is only valid for
 * `expiresIn` seconds — callers displaying older records should re-sign on render rather
 * than caching this URL long-term.
 */
export async function getSignedUrl(bucket: Bucket, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error || !data) return null
  return data.signedUrl
}
