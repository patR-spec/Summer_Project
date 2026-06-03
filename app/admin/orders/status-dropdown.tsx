'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  'pending_payment',
  'paid',
  'printing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-neutral-500',
  paid: 'text-[#1d3a5a]',
  printing: 'text-blue-600',
  shipped: 'text-[#C9A961]',
  delivered: 'text-green-700',
  cancelled: 'text-red-600',
  refunded: 'text-red-600',
}

export default function StatusDropdown({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    if (newStatus === status) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Update failed')
      }
      setStatus(newStatus)
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className={`text-xs uppercase tracking-wider bg-transparent border border-neutral-300 px-2 py-1 cursor-pointer hover:border-[#C9A961] disabled:opacity-50 ${STATUS_COLORS[status] ?? ''}`}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.replace('_', ' ')}
        </option>
      ))}
    </select>
  )
}