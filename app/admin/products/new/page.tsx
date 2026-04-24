'use client'

// This file intentionally routes /admin/products/new to the [id] editor
// with id="new". Next.js static routes take precedence so we re-export.
import ProductEditPage from '../[id]/page'

export default function NewProductPage() {
  return <ProductEditPage params={Promise.resolve({ id: 'new' })} />
}
