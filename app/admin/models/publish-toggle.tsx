'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishToggle({ modelId, isPublished }: { modelId: string; isPublished: boolean }) {
  const [pending, setPending] = useState(false)
  const [current, setCurrent] = useState(isPublished)
  const router = useRouter()

  async function handleToggle() {
    setPending(true)
    const next = !current
    try {
      const res = await fetch(`/api/admin/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: next }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Update failed')
      }
      setCurrent(next)
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`text-xs uppercase tracking-wider px-2 py-1 border transition-colors disabled:opacity-50 ${
        current
          ? 'border-[#C9A961] text-[#C9A961] hover:bg-[#C9A961] hover:text-[#0A0A0C]'
          : 'border-white/10 text-gray-600 hover:border-white/30 hover:text-white'
      }`}
    >
      {pending ? '...' : current ? 'Live' : 'Hidden'}
    </button>
  )
}
