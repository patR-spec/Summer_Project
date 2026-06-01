'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart-context'

export default function CartPage() {
  const { items, count, subtotalCents, setQuantity, remove, clear, loaded } = useCart()

  if (!loaded) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-16">
        <p className="text-xs uppercase tracking-wider text-neutral-500">Loading cart...</p>
      </main>
    )
  }

  if (count === 0) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-4">Cart</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1d3a5a] tracking-tight mb-3">
          Your cart is empty
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Browse the catalog and add a few pieces.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-[#C9A961] text-[#1d3a5a] px-6 py-3 text-xs uppercase tracking-wider hover:bg-[#C9A961] hover:text-white transition-colors"
        >
          Shop the catalog
          <span>→</span>
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between border-b border-neutral-200 pb-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-2">Cart</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1d3a5a] tracking-tight">
            Your bag ({count})
          </h1>
        </div>
        <button
          onClick={clear}
          className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#C9A961]"
        >
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-px bg-neutral-200">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 flex gap-4 items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#DCEBF7] flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.preview_image_url ? (
                  <img
                    src={item.preview_image_url}
                    alt={item.title}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/models/${item.id}`}
                  className="text-sm text-[#1d3a5a] hover:text-[#C9A961] transition-colors block truncate"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-neutral-500 mt-1">
                  ${(item.price_cents / 100).toFixed(2)} each
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 border border-neutral-300 text-xs hover:border-[#C9A961] hover:text-[#C9A961]"
                  >
                    −
                  </button>
                  <span className="text-xs tracking-wider w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 border border-neutral-300 text-xs hover:border-[#C9A961] hover:text-[#C9A961]"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#C9A961]">
                  ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                </p>
                <button
                  onClick={() => remove(item.id)}
                  className="text-xs uppercase tracking-wider text-neutral-400 hover:text-red-600 mt-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-[#DCEBF7] p-6 h-fit">
          <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-6">Summary</p>
          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between text-[#1d3a5a]">
              <span>Subtotal</span>
              <span>${(subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-500 text-xs uppercase tracking-wider">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t border-[#B8D4EB] pt-4 mb-6">
            <div className="flex justify-between text-[#1d3a5a]">
              <span className="text-xs uppercase tracking-wider">Total</span>
              <span className="text-lg font-bold text-[#C9A961]">
                ${(subtotalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            disabled
            className="w-full bg-[#1d3a5a] text-white py-4 text-xs uppercase tracking-wider opacity-50 cursor-not-allowed"
          >
            Checkout (single-item only for now)
          </button>
          <p className="text-xs text-neutral-500 mt-3 text-center">
            Multi-item checkout coming soon.<br />Use Buy Now on a product page for now.
          </p>
        </div>
      </div>
    </main>
  )
}