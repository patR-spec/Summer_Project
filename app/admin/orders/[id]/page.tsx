import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import StatusDropdown from '../status-dropdown'

type Props = { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.user_metadata?.role !== 'admin') redirect('/')

  const { id } = await params

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: order, error } = await service
    .from('orders')
    .select('*, models(title, preview_image_urls, designer_name, our_price_cents)')
    .eq('id', id)
    .single()

  if (error || !order) notFound()

  const addr = (order.shipping_address as any) ?? {}
  const created = new Date(order.created_at)

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/admin/orders"
        className="text-xs uppercase tracking-wider text-neutral-500 hover:text-[#C9A961] inline-block mb-6"
      >
        ← Back to orders
      </Link>

      <div className="border-b border-neutral-200 pb-6 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#1d3a5a] mb-2">Order</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1d3a5a] tracking-tight font-mono">
          {order.id.slice(0, 8)}
        </h1>
        <p className="text-xs text-neutral-500 mt-2">
          Placed {created.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Item + status */}
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">Item</p>
          <div className="flex gap-4 items-start mb-6">
            {order.models?.preview_image_urls?.[0] ? (
              <img
                src={order.models.preview_image_urls[0]}
                alt={order.models.title}
                className="w-24 h-24 object-cover bg-[#DCEBF7]"
              />
            ) : (
              <div className="w-24 h-24 bg-neutral-100" />
            )}
            <div>
              <p className="text-sm text-[#1d3a5a]">{order.models?.title ?? 'Custom request'}</p>
              <p className="text-xs text-neutral-500 mt-1">
                by {order.models?.designer_name ?? '—'}
              </p>
            </div>
          </div>

          <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">Status</p>
          <div className="mb-6">
            <StatusDropdown orderId={order.id} currentStatus={order.status} />
          </div>

          <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">Amount</p>
          <p className="text-2xl font-bold text-[#C9A961] mb-6">
            ${(order.total_cents / 100).toFixed(2)}
          </p>

          {order.stripe_payment_id && (
            <a
            href={`https://dashboard.stripe.com/test/checkout/sessions/${order.stripe_payment_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-wider text-[#1d3a5a] hover:text-[#C9A961]"
          >
            View in Stripe ↗
          </a>
          )}
        </div>

        {/* Shipping */}
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">Ship to</p>
          <div className="text-sm text-[#1d3a5a] space-y-1">
            <p>{addr.name ?? '—'}</p>
            <p className="text-neutral-500">{addr.email ?? '—'}</p>
            {addr.line1 && <p>{addr.line1}</p>}
            {addr.line2 && <p>{addr.line2}</p>}
            {(addr.city || addr.state) && (
              <p>{addr.city}{addr.city && addr.state ? ', ' : ''}{addr.state} {addr.postal_code ?? ''}</p>
            )}
            {addr.country && <p>{addr.country}</p>}
          </div>

          {order.estimated_ship_date && (
            <>
              <p className="text-xs uppercase tracking-wider text-[#C9A961] mt-6 mb-2">Estimated ship date</p>
              <p className="text-sm">{order.estimated_ship_date}</p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-200 mt-12 pt-6 text-xs text-neutral-500 font-mono">
        <p>Order ID: {order.id}</p>
        {order.stripe_payment_id && <p>Stripe ID: {order.stripe_payment_id}</p>}
        {order.user_id && <p>User ID: {order.user_id}</p>}
        {order.custom_request_id && <p>Custom request ID: {order.custom_request_id}</p>}
      </div>
    </main>
  )
}