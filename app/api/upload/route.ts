import { NextRequest } from 'next/server'
import { ok, err, requireAdmin } from '@/lib/api-helpers'
import { uploadImage, generateUploadSignature, deleteImage } from '@/lib/cloudinary'

// ─── POST /api/upload — server-side upload (small files) ─────────────────────

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const formData = await request.formData()
    const file     = formData.get('file') as File | null
    const folder   = (formData.get('folder') as string) ?? 'urban-drip/products'

    if (!file) return err('No file provided')

    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_SIZE) return err('File size exceeds 10 MB limit')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) return err('Only JPEG, PNG, WebP, and GIF are allowed')

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer, folder)

    return ok(result, 201)
  } catch (e) {
    console.error('POST /api/upload', e)
    return err('Upload failed', 500)
  }
}

// ─── GET /api/upload — get client-side upload signature ──────────────────────
// Used for direct browser → Cloudinary uploads (faster, no server proxy)

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const folder = request.nextUrl.searchParams.get('folder') ?? 'urban-drip/products'
    const sig    = await generateUploadSignature(folder)
    return ok(sig)
  } catch (e) {
    console.error('GET /api/upload', e)
    return err('Failed to generate upload signature', 500)
  }
}

// ─── DELETE /api/upload — delete image ───────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const { response } = await requireAdmin()
  if (response) return response

  try {
    const { public_id } = await request.json()
    if (!public_id) return err('public_id is required')

    await deleteImage(public_id)
    return ok({ message: 'Image deleted' })
  } catch (e) {
    console.error('DELETE /api/upload', e)
    return err('Failed to delete image', 500)
  }
}
