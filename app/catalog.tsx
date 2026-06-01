'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Model = {
  id: string
  title: string
  designer_name: string
  our_price_cents: number
  preview_image_urls: string[] | null
  category: string
  created_at: string
}

type SortKey = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_az'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'name_az', label: 'Name: A-Z' },
]

export default function Catalog({ models }: { models: Model[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [category, setCategory] = useState<string>('all')
  const [sortOpen, setSortOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  // Build the list of categories from the data itself
  const categories = useMemo(() => {
    const set = new Set(models.map((m) => m.category).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [models])

  // Apply filter + sort
  const visible = useMemo(() => {
    let result = models
    if (category !== 'all') {
      result = result.filter((m) => m.category === category)
    }
    const sorted = [...result]
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
        break
      case 'oldest':
        sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
        break
      case 'price_low':
        sorted.sort((a, b) => a.our_price_cents - b.our_price_cents)
        break
      case 'price_high':
        sorted.sort((a, b) => b.our_price_cents - a.our_price_cents)
        break
      case 'name_az':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
    }
    return sorted
  }, [models, sortBy, category])

  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? ''

  return (
    <section id="catalog" className="max-w-7xl mx-auto">
      {/* Filter / sort bar */}
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Catalog · {visible.length} {visible.length === 1 ? 'item' : 'items'}
        </p>

        <div className="flex items-center gap-6">
          {/* Category filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setCategoryOpen((v) => !v)
                setSortOpen(false)
              }}
              className="text-xs uppercase tracking-wider text-neutral-700 hover:text-[#C9A961] flex items-center gap-2"
            >
              <span className="text-neutral-400">Category:</span>
              <span>{category}</span>
              <span className="text-[#C9A961]">▾</span>
            </button>
            {categoryOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 z-10 min-w-[160px]">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c)
                      setCategoryOpen(false)
                    }}
                    className={`block w-full text-left px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#DCEBF7] transition-colors ${
                      c === category ? 'text-[#C9A961]' : 'text-neutral-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSortOpen((v) => !v)
                setCategoryOpen(false)
              }}
              className="text-xs uppercase tracking-wider text-neutral-700 hover:text-[#C9A961] flex items-center gap-2"
            >
              <span className="text-neutral-400">Sort:</span>
              <span>{currentSortLabel}</span>
              <span className="text-[#C9A961]">▾</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 z-10 min-w-[200px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.value)
                      setSortOpen(false)
                    }}
                    className={`block w-full text-left px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#DCEBF7] transition-colors ${
                      opt.value === sortBy ? 'text-[#C9A961]' : 'text-neutral-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-32 text-neutral-500 text-sm">
          <p className="mb-2">No items match these filters.</p>
          <button
            type="button"
            onClick={() => {
              setCategory('all')
              setSortBy('newest')
            }}
            className="text-xs uppercase tracking-wider text-[#C9A961] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((model, i) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className={`group flex flex-col justify-between aspect-square p-4 border-r border-b border-neutral-200 hover:bg-[#DCEBF7] transition-colors overflow-hidden ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#DCEBF7]/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-[#1d3a5a] tracking-wider">
                  {String(i + 1).padStart(3, '0')}
                </span>
                <span className="text-xs uppercase tracking-wider text-neutral-500">
                  {model.category}
                </span>
              </div>
              <div className="flex-1 min-h-0 flex items-center justify-center py-3">
                {model.preview_image_urls && model.preview_image_urls[0] ? (
                  <img
                    src={model.preview_image_urls[0]}
                    alt={model.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-xs text-neutral-400">No preview</div>
                )}
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-[#1d3a5a] truncate pr-2">{model.title}</span>
                <span className="text-xs font-bold text-[#C9A961] whitespace-nowrap">
                  ${(model.our_price_cents / 100).toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}