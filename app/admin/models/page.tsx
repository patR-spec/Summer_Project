import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import DeleteButton from './delete-button'
import PublishToggle from './publish-toggle'

export const dynamic = 'force-dynamic'

export default async function AdminModelsPage() {
  if (process.env.NODE_ENV !== 'development') redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.user_metadata?.role !== 'admin') redirect('/')

  // Use service role to bypass RLS (admins should see unpublished too)
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: models, error } = await serviceSupabase
    .from('models')
    .select('id, title, designer_name, our_price_cents, category, license_type, is_published, preview_image_urls, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between border-b border-white/10 pb-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Admin</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Manage models
          </h1>
          <p className="text-xs text-gray-500 mt-2">
            Logged in as {user.email}
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="border border-[#C9A961] text-white px-5 py-3 text-xs uppercase tracking-wider hover:bg-[#C9A961] hover:text-[#0A0A0C] transition-colors"
        >
          + Add new
        </Link>
      </div>

      {error && (
        <p className="text-red-400 text-sm">Error loading: {error.message}</p>
      )}

      {!models || models.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-16">No models yet.</p>
      ) : (
        <div className="border border-white/10">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 bg-[#0c1520] text-xs uppercase tracking-wider text-gray-400">
            <div className="col-span-1">Image</div>
            <div className="col-span-3">Title</div>
            <div className="col-span-2">Designer</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-1">License</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          {models.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0 border-white/10 items-center"
            >
              <div className="md:col-span-1">
                {m.preview_image_urls?.[0] ? (
                  <img
                    src={m.preview_image_urls[0]}
                    alt={m.title}
                    className="w-12 h-12 object-cover bg-[#0c1520]"
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#1a1d24] flex items-center justify-center text-xs text-gray-600">
                    —
                  </div>
                )}
              </div>
              <div className="md:col-span-3 text-sm text-gray-200 truncate">{m.title}</div>
              <div className="md:col-span-2 text-xs text-gray-400 truncate">{m.designer_name}</div>
              <div className="md:col-span-1 text-xs uppercase tracking-wider text-gray-500">{m.category}</div>
              <div className="md:col-span-1 text-xs uppercase tracking-wider text-gray-500">{m.license_type}</div>
              <div className="md:col-span-1 text-sm font-bold text-[#C9A961]">
                ${(m.our_price_cents / 100).toFixed(2)}
              </div>
              <div className="md:col-span-1">
                <PublishToggle modelId={m.id} isPublished={m.is_published} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <Link
                  href={`/admin/models/${m.id}/edit`}
                  className="text-xs uppercase tracking-wider text-gray-300 hover:text-[#C9A961]"
                >
                  Edit
                </Link>
                <DeleteButton modelId={m.id} modelTitle={m.title} />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-6">
        {models?.length ?? 0} total · {models?.filter(m => m.is_published).length ?? 0} published
      </p>
    </main>
  )
}
