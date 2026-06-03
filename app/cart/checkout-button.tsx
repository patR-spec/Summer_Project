'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

export default function CheckoutButton() {
  const { items } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const payload = {
        items: items.map((i) => ({ model_id: i.id, quantity: i.quantity })),
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.checkout_url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading || items.length === 0}
        className="w-full bg-[#1d3a5a] text-white py-4 text-xs uppercase tracking-wider hover:bg-[#C9A961] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading checkout...' : 'Checkout'}
      </button>
      {error && <p className="text-red-600 text-xs mt-3 text-center">{error}</p>}
      <p className="text-xs text-neutral-500 mt-3 text-center">
        Secure checkout powered by Stripe
      </p>
    </div>
  )
}