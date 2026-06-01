export default function AboutPage() {
    return (
      <main className="max-w-7xl mx-auto">
        <section className="bg-[#DCEBF7] border-b border-neutral-200">
          <div className="px-6 py-20 sm:py-28 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-4">
              About
            </p>
            <h1 className="text-4xl sm:text-6xl font-bold text-[#1d3a5a] tracking-tight">
              OKGenie
            </h1>
          </div>
        </section>
  
        <section className="px-6 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">01 / The idea</p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              OKGenie is a one-printer studio making physical things on request. We curate models worth printing — from museum scans to community designers — and ship each one as a one-off, made when you order it.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">02 / How it works</p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Browse the catalog. Pick a piece. We print it on demand and ship within 7 days. No mass production, no warehouse — just one printer, one piece at a time.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">03 / Credit where due</p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Every model in our catalog credits the original designer. We only carry openly-licensed work and partner directly with creators when we can.
            </p>
          </div>
        </section>
  
        <section className="border-t border-neutral-200 px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Get in touch</p>
            <p className="text-sm text-neutral-700">
              Questions, custom requests, designer partnerships:
              <br />
              <a href="mailto:hello@okgenie.com" className="text-[#C9A961] hover:underline">
                hello@okgenie.com
              </a>
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Based in</p>
            <p className="text-sm text-neutral-700">
              Maryland, USA · Shipping to United States only (for now).
            </p>
          </div>
        </section>
      </main>
    )
  }