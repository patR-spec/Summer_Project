'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

/*
  Supabase setup required to persist requests:

  1. Storage bucket — create a bucket named "custom-requests" with public read
     (or private if you want signed URLs).

  2. Database table — run in the SQL editor:
     create table public.custom_requests (
       id          uuid primary key default gen_random_uuid(),
       created_at  timestamptz not null default now(),
       name        text not null,
       email       text not null,
       description text not null,
       file_url    text
     );
     alter table public.custom_requests enable row level security;
     create policy "anyone can insert" on public.custom_requests
       for insert with check (true);

  Both steps are optional — the form shows success regardless so it works
  as a stub while you set things up.
*/

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function CustomRequestPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      let fileUrl: string | null = null

      // Upload reference file if provided
      if (file) {
        const ext = file.name.split('.').pop() ?? 'bin'
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('custom-requests')
          .upload(path, file, { upsert: false })

        if (!uploadErr) {
          const { data } = supabase.storage.from('custom-requests').getPublicUrl(path)
          fileUrl = data.publicUrl
        }
        // Non-fatal: proceed without file URL if bucket doesn't exist yet
      }

      // Persist to DB
      await supabase.from('custom_requests').insert({
        name,
        email,
        description,
        file_url: fileUrl,
      })
      // Non-fatal: ignore DB errors (table may not exist yet)

      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again or email us directly.')
    }
  }

  if (status === 'success') {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'linear-gradient(180deg, #0A0A0C 0%, #16181D 60%, #0A0A0C 100%)' }}
      >
        <div className="text-center max-w-sm">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.45em] mb-5"
            style={{ color: 'var(--gold)' }}
          >
            Request received
          </p>
          <h1
            className="font-mono font-bold text-white mb-5"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}
          >
            We'll be in touch.
          </h1>
          <p
            className="font-mono text-sm mb-10 leading-relaxed"
            style={{ color: 'var(--silver)', opacity: 0.65 }}
          >
            Thanks {name} — we'll review your request and reply to {email} within 24 hours.
          </p>
          <Link
            href="/"
            className="btn-silver-outline inline-flex items-center gap-2 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.25em]"
          >
            ← Back to shop
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen py-24 px-6"
      style={{ background: 'linear-gradient(180deg, #0A0A0C 0%, #16181D 50%, #0A0A0C 100%)' }}
    >
      <div className="max-w-lg mx-auto">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] mb-12 transition-opacity hover:opacity-60"
          style={{ color: 'var(--silver)', opacity: 0.5 }}
        >
          ← Shop
        </Link>

        <p
          className="font-mono text-[10px] uppercase tracking-[0.45em] mb-4"
          style={{ color: 'var(--gold)' }}
        >
          Custom print request
        </p>

        <h1
          className="font-mono font-bold text-white leading-tight mb-3"
          style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)' }}
        >
          Let's build something.
        </h1>

        <p
          className="font-mono text-sm mb-12 leading-relaxed"
          style={{ color: 'var(--silver)', opacity: 0.6 }}
        >
          Tell us what you need. We'll handle design, material selection, and printing.
        </p>

        {/* Thin gold divider */}
        <div className="h-px w-12 mb-10" style={{ background: 'var(--gold)', opacity: 0.4 }} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-[9px] uppercase tracking-[0.35em]"
              style={{ color: 'var(--silver)', opacity: 0.7 }}
            >
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-form"
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-[9px] uppercase tracking-[0.35em]"
              style={{ color: 'var(--silver)', opacity: 0.7 }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-form"
              placeholder="your@email.com"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-[9px] uppercase tracking-[0.35em]"
              style={{ color: 'var(--silver)', opacity: 0.7 }}
            >
              What do you need?
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-form resize-none"
              placeholder="Describe what you'd like printed — dimensions, material preferences, quantity, use case..."
            />
          </div>

          {/* File upload */}
          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-[9px] uppercase tracking-[0.35em]"
              style={{ color: 'var(--silver)', opacity: 0.7 }}
            >
              Reference file{' '}
              <span style={{ opacity: 0.45 }}>(optional)</span>
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed px-4 py-6 text-center transition-colors duration-150 hover:border-neutral-500 w-full"
              style={{ borderColor: 'rgb(64 64 64)' }}
            >
              {file ? (
                <span className="font-mono text-sm text-white">{file.name}</span>
              ) : (
                <span className="font-mono text-[11px]" style={{ color: 'var(--silver)', opacity: 0.45 }}>
                  Click to attach · .stl .obj .step .jpg .png .pdf
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".stl,.obj,.step,.stp,.jpg,.jpeg,.png,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {errorMsg && (
            <p className="font-mono text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn-gold-primary inline-flex items-center gap-3 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] disabled:opacity-40"
            >
              {status === 'submitting' ? 'Sending…' : 'Submit request →'}
            </button>

            <p
              className="font-mono text-[9px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--silver)', opacity: 0.35 }}
            >
              Reply within 24 h
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
