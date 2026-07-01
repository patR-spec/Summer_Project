import { supabase } from '@/lib/supabase'
import Catalog from './catalog'
import { HeroSection } from '@/components/hero-section'

export const dynamic = 'force-dynamic'

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
      <HeroSection />
      <Catalog models={models ?? []} />
    </main>
  )
}