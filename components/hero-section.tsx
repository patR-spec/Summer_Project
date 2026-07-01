'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// Single-stroke amphora silhouette, 400×500 viewBox, starts at top-centre of the opening
const VESSEL_PATH = [
  'M 200,50',
  'L 238,50',
  'C 264,50 274,68 265,94',
  'C 256,120 216,130 212,162',
  'C 208,194 278,228 296,292',
  'C 314,356 282,416 244,438',
  'L 200,448',
  'L 156,438',
  'C 118,416 86,356 104,292',
  'C 122,228 192,194 188,162',
  'C 184,130 144,120 135,94',
  'C 126,68 136,50 162,50',
  'Z',
].join(' ')

function PrinterHead({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle})`}>
      {/* Carriage block */}
      <rect x="-15" y="-23" width="30" height="19" rx="3" fill="#1d3a5a" />
      {/* Side rails */}
      <rect x="-20" y="-21" width="6" height="15" rx="2" fill="#C9A961" />
      <rect x="14" y="-21" width="6" height="15" rx="2" fill="#C9A961" />
      {/* Heater block */}
      <rect x="-5" y="-4" width="10" height="8" rx="1" fill="#1d3a5a" />
      {/* Nozzle taper */}
      <polygon points="-4,4 4,4 2.5,12 -2.5,12" fill="#C9A961" />
      {/* Hot tip */}
      <circle cx="0" cy="12" r="2.5" fill="white" />
      <circle cx="0" cy="12" r="5" fill="#C9A961" opacity="0.3" />
    </g>
  )
}

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [progress, setProgress] = useState(0)
  const [pathLength, setPathLength] = useState(0)
  const [headPos, setHeadPos] = useState({ x: 200, y: 50, angle: 90 })

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [])

  const onScroll = useCallback(() => {
    if (!sectionRef.current || pathLength === 0) return
    const rect = sectionRef.current.getBoundingClientRect()
    const totalScrollable = sectionRef.current.offsetHeight - window.innerHeight
    const scrolled = -rect.top
    const p = Math.max(0, Math.min(1, scrolled / totalScrollable))
    setProgress(p)

    if (pathRef.current) {
      const dist = p * pathLength
      const pt = pathRef.current.getPointAtLength(dist)
      const ptAhead = pathRef.current.getPointAtLength(Math.min(dist + 2, pathLength))
      // atan2(dx, dy) orients a down-pointing nozzle along the direction of travel
      const angle = (Math.atan2(ptAhead.x - pt.x, ptAhead.y - pt.y) * 180) / Math.PI
      setHeadPos({ x: pt.x, y: pt.y, angle })
    }
  }, [pathLength])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  const dashOffset = pathLength > 0 ? pathLength * (1 - progress) : pathLength

  // Opacity curves
  const brandOpacity = Math.max(0, 1 - progress * 3.5)
  const titleOpacity = Math.max(0, 1 - progress * 2.8)
  const scrollHintOpacity = Math.max(0, 1 - progress * 6)
  const ctaOpacity = Math.max(0, (progress - 0.72) / 0.28)
  const fillOpacity = Math.max(0, (progress - 0.6) / 0.4) * 0.08
  const showHead = progress > 0.005 && progress < 0.99

  return (
    <div ref={sectionRef} style={{ height: '290vh' }} className="relative">
      {/* Sticky viewport — fills screen while user scrolls through the 290vh wrapper */}
      <div className="sticky top-0 h-screen bg-[#DCEBF7] flex flex-col items-center justify-center overflow-hidden">

        {/* Drop label */}
        <p
          className="text-[10px] uppercase tracking-[0.28em] text-[#1d3a5a] mb-5"
          style={{ opacity: brandOpacity }}
        >
          SS26 / drop 001
        </p>

        {/* SVG print animation */}
        <div className="w-52 sm:w-64 md:w-72 relative">
          <svg viewBox="0 0 400 500" className="w-full" style={{ overflow: 'visible' }}>
            {/* Dashed ghost — shows where the path will go */}
            <path
              d={VESSEL_PATH}
              fill="none"
              stroke="#b8d4eb"
              strokeWidth="1.5"
              strokeDasharray="5 8"
            />

            {/* Filling silhouette */}
            <path d={VESSEL_PATH} fill="#1d3a5a" style={{ opacity: fillOpacity }} />

            {/* The drawn stroke — driven by scroll */}
            <path
              ref={pathRef}
              d={VESSEL_PATH}
              fill="none"
              stroke="#1d3a5a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />

            {/* FDM printer head */}
            {showHead && (
              <PrinterHead x={headPos.x} y={headPos.y} angle={headPos.angle} />
            )}
          </svg>
        </div>

        {/* Brand headline */}
        <div
          className="text-center mt-6"
          style={{ opacity: titleOpacity, pointerEvents: titleOpacity < 0.05 ? 'none' : 'auto' }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1d3a5a] tracking-tight">
            OKGenie
          </h1>
          <p className="text-[11px] text-[#1d3a5a]/60 mt-3 uppercase tracking-widest">
            3D printed objects · on request
          </p>
        </div>

        {/* Scroll hint arrow */}
        <div
          className="absolute bottom-10 flex flex-col items-center gap-2"
          style={{ opacity: scrollHintOpacity, pointerEvents: 'none' }}
        >
          <p className="text-[9px] uppercase tracking-[0.38em] text-[#1d3a5a]/40">scroll</p>
          <svg
            width="16"
            height="28"
            viewBox="0 0 16 28"
            className="animate-bounce"
            aria-hidden
          >
            <line x1="8" y1="0" x2="8" y2="20" stroke="#1d3a5a" strokeOpacity="0.35" strokeWidth="1.5" />
            <polyline points="3,16 8,24 13,16" fill="none" stroke="#1d3a5a" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* CTA — fades in as the vessel completes */}
        <div
          className="absolute bottom-12 flex flex-col items-center gap-5"
          style={{ opacity: ctaOpacity, pointerEvents: ctaOpacity < 0.05 ? 'none' : 'auto' }}
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#1d3a5a]">
            Printed. Curated. Yours.
          </p>
          <Link
            href="#catalog"
            className="inline-flex items-center gap-2 border border-[#C9A961] text-[#1d3a5a] px-7 py-3 text-xs uppercase tracking-wider hover:bg-[#C9A961] hover:text-white transition-colors"
          >
            Shop the catalog
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
