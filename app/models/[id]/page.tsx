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
    'cc-by': 'Attribution required (CC-BY)',
    'cc-by-sa': 'Attribution-ShareAlike (CC-BY-SA)',
    'proprietary': 'Licensed',
    'unclear': 'License unclear',
  }
  const licenseLabel = licenseLabels[model.license_type] ?? model.license_type

  return (
    <main className="max-w-7xl mx-auto">
      <div className="px-6 py-4 border-b border-neutral-200">
        <Link href="/" className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#C9A961] transition-colors">
          ← Back to catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-neutral-200">
        <div className="aspect-square bg-[#DCEBF7] flex items-center justify-center p-8 md:border-r border-neutral-200">
          {model.preview_image_urls && model.preview_image_urls[0] ? (
            <img
              src={model.preview_image_urls[0]}
              alt={model.title}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-xs text-neutral-500">No preview available</div>
          )}
        </div>

        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3">
              {model.category}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1d3a5a] tracking-tight mb-3">
              {model.title}
            </h1>
            <p className="text-xs text-neutral-500 mb-8">
              by{' '}
              <a href={model.original_url} target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">
                {model.designer_name}
              </a>
              {' · '}
              {model.source_site}
            </p>

            <div className="text-4xl font-bold text-[#C9A961] mb-8">
              ${(model.our_price_cents / 100).toFixed(2)}
            </div>

            <BuyButton
  modelId={model.id}
  title={model.title}
  priceCents={model.our_price_cents}
  previewImageUrl={model.preview_image_urls?.[0] ?? null}
/>

            {model.description && (
              <div className="mt-10 mb-8">
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">About</p>
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {model.description}
                </p>
              </div>
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-neutral-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500 uppercase tracking-wider">License</span>
              <span className="text-[#1d3a5a]">{licenseLabel}</span>
            </div>
            {model.estimated_print_hours && (
              <div className="flex justify-between">
                <span className="text-neutral-500 uppercase tracking-wider">Print time</span>
                <span className="text-[#1d3a5a]">~{model.estimated_print_hours} hrs</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500 uppercase tracking-wider">Source</span>
              <a href={model.original_url} target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">
                View original ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}