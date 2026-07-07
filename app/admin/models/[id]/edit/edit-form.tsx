'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

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
  preview_image_urls: string[] | null
}

const inputCls = 'w-full p-2 border border-white/10 bg-[#16181D] text-gray-200 outline-none focus:border-[#C9A961] text-sm'
const labelCls = 'block text-xs uppercase tracking-wider text-gray-500 mb-1'

export default function EditForm({ model }: { model: Model }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [images, setImages] = useState<string[]>(model.preview_image_urls ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setNewFiles((prev) => [...prev, ...files])
    // Reset input so the same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeNewFile(idx: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)

    try {
      // Upload any new image files first
      const uploadedUrls: string[] = []
      for (const file of newFiles) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('model-previews')
          .upload(path, file)
        if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`)
        const { data } = supabase.storage.from('model-previews').getPublicUrl(path)
        uploadedUrls.push(data.publicUrl)
      }

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
        preview_image_urls: [...images, ...uploadedUrls],
      }

      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      setNewFiles([])
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
      <Field name="original_url" label="Original URL (optional)" defaultValue={model.original_url} />
      <Field name="source_site" label="Source site" defaultValue={model.source_site} required />

      <div>
        <label className={labelCls}>License *</label>
        <select
          name="license_type"
          defaultValue={model.license_type}
          required
          className={inputCls}
        >
          <optgroup label="── Original / Proprietary">
            <option value="all-rights-reserved">All Rights Reserved — Original Work (no copying)</option>
            <option value="proprietary">Proprietary — 3rd Party (with permission)</option>
          </optgroup>
          <optgroup label="── Creative Commons">
            <option value="cc0">CC0 — Public Domain</option>
            <option value="cc-by">CC-BY — Attribution</option>
            <option value="cc-by-sa">CC-BY-SA — Attribution + ShareAlike</option>
            <option value="cc-by-nc">CC-BY-NC — Non-Commercial</option>
            <option value="cc-by-nc-sa">CC-BY-NC-SA — Non-Commercial + ShareAlike</option>
            <option value="cc-by-nd">CC-BY-ND — No Derivatives</option>
            <option value="cc-by-nc-nd">CC-BY-NC-ND — Non-Commercial + No Derivatives</option>
          </optgroup>
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

      {/* ── Image management ── */}
      <div>
        <label className={labelCls}>Images</label>

        {/* Existing images */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url, i) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="w-20 h-20 object-cover bg-[#0c1520] border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                  aria-label="Remove image"
                >
                  ✕
                </button>
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/60 text-gray-400 py-0.5">
                    cover
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Queued new files (not yet uploaded) */}
        {newFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {newFiles.map((file, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-20 h-20 object-cover bg-[#0c1520] border border-[#C9A961]/40"
                />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                  aria-label="Remove"
                >
                  ✕
                </button>
                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-black/60 text-[#C9A961] py-0.5">
                  new
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-white/20 text-xs uppercase tracking-wider text-gray-500 hover:border-[#C9A961] hover:text-[#C9A961] transition-colors px-4 py-2"
        >
          + Add images
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
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
