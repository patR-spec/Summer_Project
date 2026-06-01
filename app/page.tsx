import { supabase } from '@/lib/supabase'
import Catalog from './catalog'

export default async function Home() {
  const { data: models, error } = await supabase
    .from('models')
    .select('id, title, designer_name, our_price_cents, preview_image_urls, category, created_at')
    .eq('is_published', true)

  if (error) {
    return (
      <main className="p-8">
        <p className="text-red-600 text-sm">Error loading catalog: {error.message}</p>
      </main>
    )
  }

  return (
    <main>
      <section className="bg-[#DCEBF7] border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-4">
            SS26 / drop 001
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold text-[#1d3a5a] tracking-tight mb-6">
            OKGenie
          </h1>
          <p className="text-sm sm:text-base text-[#1d3a5a] mb-10 max-w-xl mx-auto">
            3D printed objects, on request. Curated catalog. Made one at a time.
          </p>
          <a
          href="#catalog"
          className="inline-flex items-center gap-2 border border-[#C9A961] text-[#1d3a5a] px-6 py-3 text-xs uppercase tracking-wider hover:bg-[#C9A961] hover:text-white transition-colors"
        >
          Shop the catalog
          <span>→</span>
          </a>
        </div>
      </section>

      <Catalog models={models ?? []} />
    </main>
  )
}