'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const inputCls = 'w-full p-2 border border-white/10 bg-[#16181D] text-gray-200 placeholder-gray-600 rounded outline-none focus:border-[#C9A961] text-sm'
const labelCls = 'block text-sm font-medium mb-1 text-gray-300'

export default function UploadForm() {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const modelFile = formData.get('model_file') as File
      const previewFiles = formData.getAll('preview_images') as File[]

      if (!modelFile || modelFile.size === 0) throw new Error('Pick a model file')
      if (!previewFiles.length || previewFiles[0].size === 0) throw new Error('Pick at least one preview image')

      // 1. Upload the STL/3MF
      const modelPath = `${Date.now()}-${modelFile.name}`
      const { error: modelErr } = await supabase.storage
        .from('model-files')
        .upload(modelPath, modelFile)
      if (modelErr) throw modelErr

      // 2. Upload all preview images
      const previewUrls: string[] = []
      for (const previewFile of previewFiles) {
        const previewPath = `${Date.now()}-${Math.random().toString(36).slice(2)}-${previewFile.name}`
        const { error: previewErr } = await supabase.storage
          .from('model-previews')
          .upload(previewPath, previewFile)
        if (previewErr) throw previewErr
        const { data: previewUrlData } = supabase.storage.from('model-previews').getPublicUrl(previewPath)
        previewUrls.push(previewUrlData.publicUrl)
      }

      // 3. Insert the database row
      const { error: dbErr } = await supabase.from('models').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        designer_name: formData.get('designer_name') as string,
        license_type: formData.get('license_type') as string,
        original_url: formData.get('original_url') as string,
        source_site: formData.get('source_site') as string,
        stl_file_url: modelPath,
        preview_image_urls: previewUrls,
        category: formData.get('category') as string,
        our_price_cents: Math.round(parseFloat(formData.get('price_dollars') as string) * 100),
        is_published: true,
      })
      if (dbErr) throw dbErr

      setMessage('✅ Model added successfully')
      form.reset()

      setTimeout(() => {
        router.push('/admin/models')
      }, 1000)
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field name="title" label="Title" required />
      <Field name="designer_name" label="Designer name" required />
      <Field name="original_url" label="Original URL (optional)" />
      <Field name="source_site" label="Source site (e.g. Printables, Scan the World)" required />

      <div>
        <label className={labelCls}>License *</label>
        <select name="license_type" required className={inputCls}>
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

      <Field name="category" label="Category (e.g. organizer, mini, decor)" required />
      <Field name="price_dollars" label="Price in dollars (e.g. 24.99)" type="number" step="0.01" required />

      <div>
        <label className={labelCls}>Description</label>
        <textarea name="description" rows={4} className={inputCls + ' resize-none'} />
      </div>

      <div>
        <label className={labelCls}>Model file (.stl or .3mf) *</label>
        <input type="file" name="model_file" accept=".stl,.3mf" required className="text-gray-300 text-sm" />
      </div>

      <div>
        <label className={labelCls}>Preview images * (select multiple)</label>
        <input type="file" name="preview_images" accept="image/*" multiple required className="text-gray-300 text-sm" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-[#C9A961] text-[#0A0A0C] px-6 py-2 rounded hover:bg-[#a58943] disabled:opacity-50"
      >
        {submitting ? 'Uploading...' : 'Add model'}
      </button>

      {message && <p className="text-sm mt-2 text-gray-300">{message}</p>}
    </form>
  )
}

function Field({ name, label, type = 'text', step, required = false }: {
  name: string; label: string; type?: string; step?: string; required?: boolean
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
        required={required}
        className={inputCls}
      />
    </div>
  )
}
