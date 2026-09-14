import { createClient } from '@sanity/client'
import env from '@/config/env'

export const sanityClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  useCdn: true,
  apiVersion: env.SANITY_API_VERSION,
})

export const urlForImage = (source) => {
  if (!source || !source.asset || !source.asset._ref) return ''
  const ref = source.asset._ref
  // Format: image-7d2d3a3f-1200x800-jpg
  const parts = ref.split('-')
  if (parts.length < 4) return ''
  const id = parts[1]
  const dimensions = parts[2]
  const extension = parts[3]
  return `${env.SANITY_CDN_BASE_URL}/${env.SANITY_PROJECT_ID}/${env.SANITY_DATASET}/${id}-${dimensions}.${extension}`
}

export const fetchPosts = async () => {
  return sanityClient.fetch(`*[_type == "post"] | order(date desc)`)
}

export const fetchPostBySlug = async (slug) => {
  return sanityClient.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug })
}

