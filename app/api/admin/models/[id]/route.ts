import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', status: 401 } as const
  if (user.user_metadata?.role !== 'admin') return { error: 'Not authorized', status: 403 } as const
  return { user } as const
}

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // Rate limit: 60 writes per minute per admin
  const rl = checkRateLimit({
    key: getRateLimitKey(request, `admin-models-${auth.user.id}`),
    limit: 60,
    windowMs: 60 * 1000,
  })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { id } = await params
  const body = await request.json()

  // Only allow specific fields to be patched
  const allowed = [
    'title', 'description', 'designer_name', 'license_type',
    'original_url', 'source_site', 'category', 'our_price_cents',
    'is_published', 'estimated_print_hours', 'preview_image_urls',
  ]
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  // Type-safe validation on specific fields
  if ('license_type' in updates) {
    const valid = ['cc0', 'cc-by', 'cc-by-sa', 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd', 'proprietary', 'all-rights-reserved', 'unclear']
    if (!valid.includes(updates.license_type)) {
      return NextResponse.json({ error: 'Invalid license_type' }, { status: 400 })
    }
  }
  if ('our_price_cents' in updates) {
    const price = Number(updates.our_price_cents)
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }
    updates.our_price_cents = Math.round(price)
  }
  if ('is_published' in updates) {
    updates.is_published = Boolean(updates.is_published)
  }
  if ('preview_image_urls' in updates) {
    if (!Array.isArray(updates.preview_image_urls)) {
      return NextResponse.json({ error: 'preview_image_urls must be an array' }, { status: 400 })
    }
    updates.preview_image_urls = (updates.preview_image_urls as unknown[])
      .filter((u) => typeof u === 'string')
      .slice(0, 20)
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await service().from('models').update(updates).eq('id', id)
  if (error) {
    console.error('Update model failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/admin/models')
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // Rate limit: 60 writes per minute per admin
  const rl = checkRateLimit({
    key: getRateLimitKey(request, `admin-models-${auth.user.id}`),
    limit: 60,
    windowMs: 60 * 1000,
  })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { id } = await params

  const { error } = await service().from('models').delete().eq('id', id)
  if (error) {
    console.error('Delete model failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/admin/models')
  return NextResponse.json({ success: true })
}