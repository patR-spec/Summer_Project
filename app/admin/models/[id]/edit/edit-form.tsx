'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Model = {
  id: string
  title: string
  description: string | null
  designer_name: string
  license_type: string
  original_url: string
  source_site: string
  category: string
  our_price_cents: number
  estimated_print_hours: number | null
  is_published: boolean
}

const inputCls = 'w-full p-2 border border-white/10 bg-[#16181D] text-gray-200 outline-none focus:border-[#C9A961] text-sm'
const labelCls = 'block text-xs uppercase tracking-wider text-gray-500 mb-1'

export default function EditForm({ model }: { model: Model }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const updates = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      designer_name: formData.get('designer_name') as string,
      license_type: formData.get('license_type') as string,
      original_url: formData.get('original_url') as string,
      source_site: formData.get('source_site') as string,
      category: formData.get('category') as string,
      our_price_cents: Math.round(parseFloat(formData.get('price_dollars') as string) * 100),
      estimated_print_hours: formData.get('estimated_print_hours')
        ? parseFloat(formData.get('estimated_print_hours') as string)
        : null,
      is_published: formData.get('is_published') === 'on',
    }

    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setMessage('✅ Saved')
      router.refresh()
      setTimeout(() => setMessage(''), 2000)
    } catch (err: any) {
      setMessage('❌ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field name="title" label="Title" defaultValue={model.title} required />
      <Field name="designer_name" label="Designer name" defaultValue={model.designer_name} required />
      <Field name="original_url" label="Original URL" defaultValue={model.original_url} required />
      <Field name="source_site" label="Source site" defaultValue={model.source_site} required />

      <div>
        <label className={labelCls}>License *</label>
        <select
          name="license_type"
          defaultValue={model.license_type}
          required
          className={inputCls}
        >
          <option value="cc0">CC0 (Public Domain)</option>
          <option value="cc-by">CC-BY (Attribution required)</option>
          <option value="cc-by-sa">CC-BY-SA</option>
          <option value="proprietary">Proprietary (with permission)</option>
        </select>
      </div>

      <Field name="category" label="Category" defaultValue={model.category} required />
      <Field
        name="price_dollars"
        label="Price (dollars)"
        type="number"
        step="0.01"
        defaultValue={(model.our_price_cents / 100).toFixed(2)}
        required
      />
      <Field
        name="estimated_print_hours"
        label="Estimated print hours (optional)"
        type="number"
        step="0.1"
        defaultValue={model.estimated_print_hours?.toString() ?? ''}
      />

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          name="description"
          rows={5}
          defaultValue={model.description ?? ''}
          className={inputCls + ' resize-none'}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <input
          type="checkbox"
          name="is_published"
          id="is_published"
          defaultChecked={model.is_published}
          className="accent-[#C9A961] w-4 h-4"
        />
        <label htmlFor="is_published" className="text-xs uppercase tracking-wider text-gray-300">
          Published (visible in catalog)
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#C9A961] text-[#0A0A0C] px-6 py-3 text-xs uppercase tracking-wider hover:bg-[#a58943] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {message && <span className="text-sm">{message}</span>}
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  defaultValue,
  type = 'text',
  step,
  required = false,
}: {
  name: string
  label: string
  defaultValue?: string
  type?: string
  step?: string
  required?: boolean
}) {
  return (
    <div>
      <label className={labelCls}>
        {label} {required && '*'}
      </label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
        className={inputCls}
      />
    </div>
  )
}
