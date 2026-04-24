import { v2 as cloudinary } from 'cloudinary'
import type { CloudinaryUploadResult, CloudinaryTransformPreset } from '@/types'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
})

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadImage(
  fileBuffer: Buffer | string,
  folder = 'urban-drip/products'
): Promise<CloudinaryUploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof fileBuffer === 'string' ? fileBuffer : `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
    {
      folder,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      overwrite: false,
    }
  )

  return {
    public_id:     result.public_id,
    secure_url:    result.secure_url,
    width:         result.width,
    height:        result.height,
    format:        result.format,
    bytes:         result.bytes,
    resource_type: result.resource_type,
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

// ─── URL transforms ───────────────────────────────────────────────────────────

const TRANSFORMS: Record<CloudinaryTransformPreset, string> = {
  thumbnail: 'w_200,h_200,c_fill,f_auto,q_auto',
  card:      'w_400,h_500,c_fill,f_auto,q_auto',
  detail:    'w_800,f_auto,q_auto',
  zoom:      'w_1200,f_auto,q_auto',
}

export function getImageUrl(
  cloudinaryUrl: string,
  preset: CloudinaryTransformPreset = 'card'
): string {
  if (!cloudinaryUrl) return '/placeholder-product.jpg'

  const transform = TRANSFORMS[preset]
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  // Already a Cloudinary URL — inject transform
  if (cloudinaryUrl.includes('cloudinary.com')) {
    return cloudinaryUrl.replace('/upload/', `/upload/${transform}/`)
  }

  // Public ID — build full URL
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${cloudinaryUrl}`
}

export function getProductImages(
  images: string[],
  preset: CloudinaryTransformPreset = 'card'
): string[] {
  if (!images || images.length === 0) return ['/placeholder-product.jpg']
  return images.map(img => getImageUrl(img, preset))
}

// ─── Client-side upload signature (called from the upload API route) ──────────

export async function generateUploadSignature(folder = 'urban-drip/products') {
  const timestamp = Math.round(Date.now() / 1000)
  const params = { timestamp, folder }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key:    process.env.CLOUDINARY_API_KEY!,
  }
}

export { cloudinary }
