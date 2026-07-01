'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Belt-and-suspenders: set muted via DOM property in case the React prop
    // doesn't take in older browser builds.
    if (videoRef.current) {
      videoRef.current.muted = true
    }
  }, [])

  return (
    <section
      className="relative h-screen overflow-hidden"
      aria-label="Hero"
    >
      {/* ── Video background ── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/hero-poster.png"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* ── Gradient overlay ──
          Top: light scrim so the header border blends cleanly.
          Middle: mostly transparent — let the video breathe.
          Bottom 40%: heavy fade for text legibility. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(6,6,9,0.40) 0%, rgba(6,6,9,0.12) 32%, rgba(6,6,9,0.55) 68%, rgba(6,6,9,0.88) 100%)',
        }}
      />

      {/* ── Content — lower-center ── */}
      <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-14 text-center sm:pb-20">
        {/* Eye-brow */}
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.38em] text-white/50 sm:text-[11px]">
          SS26 / drop 001
        </p>

        {/* Headline */}
        <h1
          className="mb-4 font-mono font-bold leading-none tracking-tight text-white"
          style={{
            fontSize: 'clamp(2.8rem, 7.5vw, 6.5rem)',
            textShadow: '0 2px 32px rgba(0,0,0,0.55)',
          }}
        >
          OkayGenie
        </h1>

        {/* Sub-copy */}
        <p className="mb-9 max-w-xs font-mono text-xs uppercase tracking-[0.22em] text-white/60 sm:max-w-sm sm:text-sm">
          3D printed objects · on request
        </p>

        {/* Primary CTA */}
        <Link
          href="#catalog"
          className="inline-flex items-center gap-3 border border-[#C9A961]/80 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.25em] text-[#C9A961] transition-colors duration-200 hover:bg-[#C9A961] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A961] sm:px-9 sm:py-4 sm:text-xs"
        >
          Shop the catalog
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* ── Scroll hint ── */}
      <div className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/28">
          scroll
        </p>
        <svg
          width="14"
          height="24"
          viewBox="0 0 14 24"
          className="animate-bounce"
          aria-hidden="true"
        >
          <line
            x1="7" y1="0" x2="7" y2="18"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
          />
          <polyline
            points="2,14 7,22 12,14"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  )
}
