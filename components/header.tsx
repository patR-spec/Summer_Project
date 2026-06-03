'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart-context'

export default function Header() {
  const { count } = useCart()

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 grid grid-cols-3 items-center">
        {/* Left: Logo (large, but clipped to header height) */}
        <div className="flex items-center h-full overflow-hidden">
          <Link href="/" className="inline-flex items-center h-full">
            <Image
              src="/logo.png"
              alt="OKGenie"
              width={600}
              height={240}
              priority
              className="h-[475%] w-auto object-contain -my-4"
            />
          </Link>
        </div>

        {/* Center: Nav */}
        <nav className="flex items-center justify-center gap-10 text-xs uppercase tracking-[0.18em]">
          <Link href="/" className="text-neutral-900 hover:text-[#C9A961] transition-colors">
            Shop
          </Link>
          <Link href="/lookbook" className="text-neutral-500 hover:text-[#C9A961] transition-colors">
            Lookbook
          </Link>
          <Link href="/about" className="text-neutral-500 hover:text-[#C9A961] transition-colors">
            About
            </Link>
            <Link href="/admin/orders" className="text-neutral-500 hover:text-[#C9A961] transition-colors">
            Orders
          </Link>
          <Link href="/admin/models" className="text-neutral-500 hover:text-[#C9A961] transition-colors">
            Models
          </Link>
        </nav>

        {/* Right: Cart */}
        <div className="flex items-center justify-end">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-neutral-900 hover:text-[#C9A961] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Cart ({count})</span>
          </Link>
        </div>
      </div>
    </header>
  )
}