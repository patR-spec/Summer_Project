'use client'

import { useState } from 'react'

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)
  const hasMultiple = images.length > 1

  return (
    <div>
      {/* Main image */}
      <div className="aspect-square bg-[#0c1520] flex items-center justify-center p-8 relative group">
        {images[idx] ? (
          <img
            src={images[idx]}
            alt={alt}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-xs text-gray-500">No preview available</div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => setIdx((v) => (v - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-xl text-white/50 hover:text-white bg-black/30 hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 select-none"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((v) => (v + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-xl text-white/50 hover:text-white bg-black/30 hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 select-none"
              aria-label="Next image"
            >
              ›
            </button>

            {/* Image count badge */}
            <div className="absolute bottom-3 right-3 bg-black/50 text-gray-400 text-[10px] uppercase tracking-wider px-2 py-1">
              {idx + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="flex gap-2 p-3 border-t border-white/10 overflow-x-auto">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors ${
                i === idx
                  ? 'border-[#C9A961]'
                  : 'border-transparent hover:border-white/30'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img
                src={url}
                alt={`${alt} — view ${i + 1}`}
                className="w-full h-full object-cover bg-[#0c1520]"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
