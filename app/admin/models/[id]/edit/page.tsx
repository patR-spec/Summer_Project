import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import EditForm from './edit-form'

type Props = { params: Promise<{ id: string }> }

export default async function EditModelPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.user_metadata?.role !== 'admin') redirect('/')

  const { id } = await params

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: model, error } = await service
    .from('models')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !model) notFound()

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/admin/models"
        className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#C9A961] inline-block mb-6"
      >
        ← Back to models
      </Link>

      <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-2">Admin · Edit</p>
      <h1 className="text-3xl font-bold text-[#1d3a5a] tracking-tight mb-8">
        {model.title}
      </h1>

      <EditForm model={model} />
    </main>
  )
}