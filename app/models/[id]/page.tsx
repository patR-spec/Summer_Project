import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import BuyButton from './buy-button'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ModelPage({ params }: Props) {
  const { id } = await params

  const { data: model, error } = await supabase
    .from('models')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (error || !model) {
    notFound()
  }

  const licenseLabels: Record<string, string> = {
    'cc0': 'Public Domain (CC0)',
    'cc-by': 'Creative Commons — Attribution',
    'cc-by-sa': 'Creative Commons — Attribution-ShareAlike',
    'proprietary': 'Licensed',
    'unclear': 'License unclear',
  }
  const licenseLabel = licenseLabels[model.license_type] ?? model.license_type

  return (
    <main className="max-w-5xl mx-auto p-6">
      <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 inline-block mb-6">
        ← Back to catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {model.preview_image_urls && model.preview_image_urls[0] ? (
            <img
              src={model.preview_image_urls[0]}
              alt={model.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No preview available
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            {model.category}
          </p>
          <h1 className="text-3xl font-bold mb-2">{model.title}</h1>
          <p className="text-gray-600 mb-4">
            by <a href={model.original_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{model.designer_name}</a> on {model.source_site}
          </p>

          <div className="text-3xl font-bold mb-6">
            ${(model.our_price_cents / 100).toFixed(2)}
          </div>

          <BuyButton modelId={model.id} />

          {model.description && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2">About this model</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{model.description}</p>
            </div>
          )}

          <div className="border-t pt-4 text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">License:</span> {licenseLabel}</p>
            <p>
              <span className="font-medium">Original:</span>{' '}
              <a href={model.original_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View source</a>
            </p>
            {model.estimated_print_hours && (
              <p>
                <span className="font-medium">Estimated print time:</span> {model.estimated_print_hours} hours
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}