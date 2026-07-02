import { supabase } from '@/lib/supabase'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

export default async function LookbookPage() {
  const { data: models } = await supabase
    .from('models')
    .select('id, title, preview_image_urls, category')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <main>
      <section className="bg-[#0c1520] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">
            SS26 / Lookbook
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
            Lookbook
          </h1>
          <p className="text-sm text-gray-300 max-w-xl mx-auto">
            Every piece in the collection. Tap an image to view.
          </p>
        </div>
      </section>

      {!models || models.length === 0 ? (
        <div className="text-center py-32 text-gray-500 text-sm">
          No items in the lookbook yet.
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1d24]">
          {models.map((model, i) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="group bg-[#16181D] aspect-[4/5] flex flex-col"
            >
              <div className="flex-1 bg-[#0c1520] flex items-center justify-center p-8 overflow-hidden">
                {model.preview_image_urls && model.preview_image_urls[0] ? (
                  <img
                    src={model.preview_image_urls[0]}
                    alt={model.title}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-xs text-gray-600">No preview</div>
                )}
              </div>
              <div className="p-6 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-gray-500">
                  {String(i + 1).padStart(3, '0')} · {model.category}
                </span>
                <span className="text-sm text-gray-200">{model.title}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
