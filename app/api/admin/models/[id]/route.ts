import { NextResponse } from 'next/server'
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
    'is_published', 'estimated_print_hours',
  ]
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await service().from('models').update(updates).eq('id', id)
  if (error) {
    console.error('Update model failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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

  return NextResponse.json({ success: true })
}