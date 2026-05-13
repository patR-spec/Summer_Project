import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const { data: models, error } = await supabase
    .from('models')
    .select('id, title, designer_name, our_price_cents, preview_image_urls, category')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="p-8">
        <p className="text-red-600">Error loading catalog: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">OKGenie</h1>
        <p className="text-gray-600 mt-1">
          Curated, print-ready 3D models. We print, you receive.
        </p>
      </header>

      {!models || models.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No models yet.</p>
          <p className="text-sm">Check back soon — we&apos;re curating the catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="group block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {model.preview_image_urls && model.preview_image_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={model.preview_image_urls[0]}
                    alt={model.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No preview
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 line-clamp-1">{model.title}</h2>
                <p className="text-sm text-gray-500 mt-1">by {model.designer_name}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {model.category}
                  </span>
                  <span className="font-bold text-gray-900">
                    ${(model.our_price_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}