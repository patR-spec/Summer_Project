'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export function HeroSection() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const stickyRef     = useRef<HTMLDivElement>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)

  // Phase 1
  const hintRef       = useRef<HTMLDivElement>(null)

  // Phase 2
  const barTrackRef   = useRef<HTMLDivElement>(null)
  const barFillRef    = useRef<HTMLDivElement>(null)
  const statusRef     = useRef<HTMLParagraphElement>(null)

  // Phase 3 — individual stagger targets
  const headlineRef   = useRef<HTMLDivElement>(null)
  const sublineRef    = useRef<HTMLParagraphElement>(null)
  const ctasRef       = useRef<HTMLDivElement>(null)
  // Wrapper to toggle pointer-events
  const contentRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const stickyEl  = stickyRef.current
    const video     = videoRef.current
    if (!container || !stickyEl || !video) return

    // ── Local mutable state (never triggers React re-renders) ──────────────
    let targetP    = 0   // set by scroll handler
    let currentP   = 0   // smoothed by rAF lerp
    let metaLoaded = video.readyState >= 1
    let rafId      = 0
    let isVisible  = false

    // Cache scroll geometry once at mount (cheap, won't change while user scrolls)
    // totalScrollable = how far you can scroll before the sticky element unpins
    const scrollStart     = window.scrollY + container.getBoundingClientRect().top
    const totalScrollable = container.offsetHeight - stickyEl.offsetHeight

    // ── Video metadata ──────────────────────────────────────────────────────
    const onMeta = () => { metaLoaded = true }
    if (!metaLoaded) video.addEventListener('loadedmetadata', onMeta, { once: true })

    // ── Scroll handler — writes only one number, zero DOM reads ────────────
    const onScroll = () => {
      targetP = Math.max(0, Math.min(1, (window.scrollY - scrollStart) / totalScrollable))
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── UI updater (called from rAF only, never from scroll) ───────────────
    const updateUI = (p: number) => {
      // Phase 1 — scroll hint (0 → 15%)
      const hint = hintRef.current
      if (hint) hint.style.opacity = String(p < 0.15 ? 1 - p / 0.15 : 0)

      // Phase 2 — gold progress bar (15% → 75%)
      const track = barTrackRef.current
      if (track) {
        const vis = p > 0.12 && p < 0.78
        const alpha = !vis ? 0
          : p < 0.17 ? (p - 0.12) / 0.05
          : p > 0.73 ? (0.78 - p) / 0.05
          : 1
        track.style.opacity = String(alpha)
      }

      const fill = barFillRef.current
      if (fill) {
        const fillP = p <= 0.15 ? 0 : p >= 0.75 ? 1 : (p - 0.15) / 0.60
        fill.style.transform = `scaleX(${fillP})`
      }

      // Phase 2 — status label (15% → 75%)
      const status = statusRef.current
      if (status) {
        if (p >= 0.15 && p < 0.75) {
          const phaseP   = (p - 0.15) / 0.60
          const labelOp  = phaseP < 0.10 ? phaseP / 0.10 : phaseP > 0.88 ? (1 - phaseP) / 0.12 : 1
          status.style.opacity = String(labelOp)
          const next = p < 0.35 ? 'HEATING NOZZLE…' : p < 0.60 ? 'PRINTING…' : 'FINISHING…'
          if (status.textContent !== next) status.textContent = next
        } else {
          status.style.opacity = '0'
        }
      }

      // Phase 3 — pointer-events gate (content only interactive when visible)
      const wrapper = contentRef.current
      if (wrapper) wrapper.style.pointerEvents = p >= 0.92 ? 'auto' : 'none'

      // Phase 3 — headline pops in once video ends (93% → 98%)
      const headline = headlineRef.current
      if (headline) {
        const op = p >= 0.93 ? Math.min(1, (p - 0.93) / 0.05) : 0
        headline.style.opacity   = String(op)
        headline.style.transform = `translateY(${(1 - op) * 24}px)`
      }

      // Phase 3 — subline (95% → 100%)
      const subline = sublineRef.current
      if (subline) {
        const op = p >= 0.95 ? Math.min(1, (p - 0.95) / 0.05) : 0
        subline.style.opacity   = String(op)
        subline.style.transform = `translateY(${(1 - op) * 16}px)`
      }

      // Phase 3 — CTAs (97% → 100%)
      const ctas = ctasRef.current
      if (ctas) {
        const op = p >= 0.97 ? Math.min(1, (p - 0.97) / 0.03) : 0
        ctas.style.opacity   = String(op)
        ctas.style.transform = `translateY(${(1 - op) * 12}px)`
      }
    }

    // ── rAF tick — lerp + seek + UI (nothing else runs per frame) ──────────
    const tick = () => {
      // Ease current toward target
      currentP += (targetP - currentP) * 0.12

      // Scrub video — only after metadata is ready
      if (metaLoaded && isFinite(video.duration) && video.duration > 0) {
        const newTime = currentP * video.duration
        if (Math.abs(video.currentTime - newTime) > 1 / 60) {
          video.currentTime = newTime
        }
      }

      updateUI(currentP)

      rafId = requestAnimationFrame(tick)
    }

    // ── IntersectionObserver — pause loop when hero is off-screen ──────────
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible) {
        cancelAnimationFrame(rafId) // guard against double-start
        rafId = requestAnimationFrame(tick)
      } else {
        cancelAnimationFrame(rafId)
      }
    }, { threshold: 0 })
    io.observe(container)

    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ height: '350vh' }}>

      {/* ── Sticky viewport — pinned, fills the screen ── */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: '100dvh', background: '#0A0A0C' }}
        aria-label="Hero"
      >

        {/* Video — absolutely fills the sticky viewport, NO overlay on top */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster="/hero-poster.png"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src="/hero-scrub.mp4" type="video/mp4" />
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* ── Phase 1: Scroll hint — bottom-center, fades out by 15% ── */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <p
            className="font-mono text-[9px] uppercase tracking-[0.45em]"
            style={{ color: 'var(--silver)', opacity: 0.55 }}
          >
            Scroll to print
          </p>
          <svg width="14" height="24" viewBox="0 0 14 24" className="animate-bounce" aria-hidden="true">
            <line x1="7" y1="0" x2="7" y2="18" stroke="rgba(192,196,204,0.30)" strokeWidth="1.5" />
            <polyline
              points="2,14 7,22 12,14"
              fill="none"
              stroke="rgba(192,196,204,0.30)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ── Phase 2: Status label — sits just above the progress bar ── */}
        <p
          ref={statusRef}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.40em]"
          style={{ bottom: '1.625rem', color: 'var(--silver)', opacity: 0 }}
          aria-live="polite"
        >
          HEATING NOZZLE…
        </p>

        {/* ── Phase 2: Gold progress bar — bottom edge ── */}
        <div
          ref={barTrackRef}
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{ height: '1.5px', background: 'rgba(255,255,255,0.06)', opacity: 0 }}
          aria-hidden="true"
        >
          <div
            ref={barFillRef}
            className="absolute inset-y-0 left-0 w-full origin-left"
            style={{
              background: 'linear-gradient(90deg, var(--gold) 0%, var(--gold-bright) 100%)',
              transform: 'scaleX(0)',
            }}
          />
        </div>

        {/* ── Phase 3: Content block — pops in as video finishes (93–100%) ── */}
        <div
          ref={contentRef}
          className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center pb-16 sm:pb-20 px-6"
          style={{ pointerEvents: 'none' }}
        >
          {/*
            Localized gradient — only darkens the region directly behind the text.
            The video remains fully visible everywhere else.
          */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 110% 85% at 50% 108%, rgba(10,10,12,0.90) 0%, rgba(10,10,12,0.55) 42%, transparent 68%)',
            }}
          />

          {/* Headline + eyebrow — enter at 75% */}
          <div
            ref={headlineRef}
            className="relative"
            style={{ opacity: 0, transform: 'translateY(24px)' }}
          >
            <p
              className="mb-4 font-mono text-[10px] uppercase tracking-[0.38em] sm:text-[11px]"
              style={{ color: 'var(--silver)', opacity: 0.5 }}
            >
              SS26 / drop 001
            </p>
            <h1
              className="mb-4 font-mono font-bold leading-none tracking-tight text-white"
              style={{
                fontSize: 'clamp(2.8rem, 7.5vw, 6.5rem)',
                textShadow: '0 2px 20px rgba(0,0,0,0.55), 0 0 48px rgba(0,0,0,0.28)',
              }}
            >
              OkayGenie
            </h1>
          </div>

          {/* Subline — enters at 80% */}
          <p
            ref={sublineRef}
            className="relative mb-10 max-w-xs font-mono text-xs uppercase tracking-[0.22em] sm:max-w-sm sm:text-sm"
            style={{ color: 'var(--silver)', opacity: 0, transform: 'translateY(16px)' }}
          >
            3D printed objects · on request
          </p>

          {/* CTAs — enter at 85% */}
          <div
            ref={ctasRef}
            className="relative flex flex-col sm:flex-row items-center gap-4"
            style={{ opacity: 0, transform: 'translateY(12px)' }}
          >
            <Link
              href="/custom-request"
              className="btn-gold-primary inline-flex items-center gap-3 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] sm:px-10 sm:py-4 sm:text-xs"
            >
              Request a custom print
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/shop"
              className="btn-silver-outline inline-flex items-center gap-3 px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.22em] sm:px-10 sm:py-4 sm:text-xs"
            >
              Shop the catalog
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
