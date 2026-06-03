'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart-context'

export default function CartClearer() {
  const { clear } = useCart()

  useEffect(() => {
    clear()
  }, [clear])

  return null
}