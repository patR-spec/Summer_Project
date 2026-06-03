'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteButton({ modelId, modelTitle }: { modelId: string; modelTitle: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${modelTitle}"? This can't be undone.`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/models/${modelId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Delete failed')
      }
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs uppercase tracking-wider text-neutral-500 hover:text-red-600 disabled:opacity-50"
    >
      {deleting ? '...' : 'Delete'}
    </button>
  )
}