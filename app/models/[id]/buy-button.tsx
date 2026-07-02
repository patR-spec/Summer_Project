'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'

type Props = {
  modelId: string
  title: string
  priceCents: number
  previewImageUrl: string | null
}

export default function BuyButton({ modelId, title, priceCents, previewImageUrl }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const { add } = useCart()
  const router = useRouter()

  async function handleBuyNow() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  function handleAddToCart() {
    add({
      id: modelId,
      title,
      price_cents: priceCents,
      preview_image_url: previewImageUrl,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="mb-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleAddToCart}
          className="border border-white/20 text-white py-4 text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
        >
          {added ? 'Added ✓' : 'Add to cart'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={loading}
          className="bg-[#C9A961] text-[#0A0A0C] py-4 text-xs uppercase tracking-wider hover:bg-[#a58943] transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Buy now'}
        </button>
      </div>

      {added && (
        <button
          onClick={() => router.push('/cart')}
          className="mt-2 w-full text-xs uppercase tracking-wider text-[#C9A961] hover:underline"
        >
          View cart →
        </button>
      )}

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
