'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

const navLinks = [
  { href: '/', label: 'Shop' },
  { href: '/lookbook', label: 'Lookbook' },
  { href: '/about', label: 'About' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/models', label: 'Models' },
]

export default function Header() {
  const { count } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between sm:grid sm:grid-cols-3">
        {/* Logo */}
        <div className="flex items-center h-full overflow-hidden">
          <Link href="/" className="inline-flex items-center h-full" onClick={() => setMobileOpen(false)}>
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

        {/* Center: Nav — hidden on mobile */}
        <nav className="hidden sm:flex items-center justify-center gap-10 text-xs uppercase tracking-[0.18em]">
          <Link href="/" className="text-neutral-900 hover:text-[#C9A961] transition-colors">Shop</Link>
          <Link href="/lookbook" className="text-neutral-500 hover:text-[#C9A961] transition-colors">Lookbook</Link>
          <Link href="/about" className="text-neutral-500 hover:text-[#C9A961] transition-colors">About</Link>
          <Link href="/admin/orders" className="text-neutral-500 hover:text-[#C9A961] transition-colors">Orders</Link>
          <Link href="/admin/models" className="text-neutral-500 hover:text-[#C9A961] transition-colors">Models</Link>
        </nav>

        {/* Right: Cart + hamburger */}
        <div className="flex items-center justify-end gap-5">
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

          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="sm:hidden flex flex-col justify-center gap-[5px] w-6 h-6"
          >
            <span
              className={`block h-px bg-neutral-900 transition-all duration-200 origin-center ${
                mobileOpen ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5'
              }`}
            />
            <span
              className={`block h-px bg-neutral-900 transition-all duration-200 ${
                mobileOpen ? 'opacity-0 w-5' : 'w-5'
              }`}
            />
            <span
              className={`block h-px bg-neutral-900 transition-all duration-200 origin-center ${
                mobileOpen ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="sm:hidden border-t border-neutral-200 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-6 py-4 text-xs uppercase tracking-[0.18em] text-neutral-700 hover:text-[#C9A961] hover:bg-[#DCEBF7] border-b border-neutral-100 transition-colors last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
