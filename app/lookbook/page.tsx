import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function LookbookPage() {
  const { data: models } = await supabase
    .from('models')
    .select('id, title, preview_image_urls, category')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <main>
      <section className="bg-[#DCEBF7] border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-4">
            SS26 / Lookbook
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold text-[#1d3a5a] tracking-tight mb-4">
            Lookbook
          </h1>
          <p className="text-sm text-[#1d3a5a] max-w-xl mx-auto">
            Every piece in the collection. Tap an image to view.
          </p>
        </div>
      </section>

      {!models || models.length === 0 ? (
        <div className="text-center py-32 text-neutral-500 text-sm">
          No items in the lookbook yet.
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200">
          {models.map((model, i) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="group bg-white aspect-[4/5] flex flex-col"
            >
              <div className="flex-1 bg-[#DCEBF7] flex items-center justify-center p-8 overflow-hidden">
                {model.preview_image_urls && model.preview_image_urls[0] ? (
                  <img
                    src={model.preview_image_urls[0]}
                    alt={model.title}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-xs text-neutral-500">No preview</div>
                )}
              </div>
              <div className="p-6 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-neutral-500">
                  {String(i + 1).padStart(3, '0')} · {model.category}
                </span>
                <span className="text-sm text-[#1d3a5a]">{model.title}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}