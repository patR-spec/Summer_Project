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
    .select('*, models(title, preview_image_urls, designer_name, our_price_cents), order_items(id, quantity, unit_price_cents, title_snapshot, preview_image_url, model_id)')
    .eq('id', id)
    .single()

  if (error || !order) notFound()

  const addr = (order.shipping_address as any) ?? {}
  const created = new Date(order.created_at)

  // Build a unified items list: prefer order_items, fall back to legacy single model
  const items =
    order.order_items && order.order_items.length > 0
      ? order.order_items
      : order.models
      ? [{
          id: 'legacy',
          quantity: 1,
          unit_price_cents: order.models.our_price_cents,
          title_snapshot: order.models.title,
          preview_image_url: order.models.preview_image_urls?.[0] ?? null,
          model_id: order.model_id,
        }]
      : []

  const totalQuantity = items.reduce((sum: number, i: any) => sum + i.quantity, 0)

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
        {/* Items + status */}
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">
            Items ({totalQuantity})
          </p>

          {items.length === 0 ? (
            <p className="text-sm text-neutral-500 mb-6">No items recorded.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-start border-b border-neutral-100 pb-4 last:border-b-0">
                  {item.preview_image_url ? (
                    <img
                      src={item.preview_image_url}
                      alt={item.title_snapshot}
                      className="w-20 h-20 object-cover bg-[#DCEBF7] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-neutral-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1d3a5a] truncate">{item.title_snapshot}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Qty {item.quantity} · ${(item.unit_price_cents / 100).toFixed(2)} each
                    </p>
                    {item.model_id && (
                      <Link
                        href={`/models/${item.model_id}`}
                        className="text-xs uppercase tracking-wider text-[#C9A961] hover:underline mt-1 inline-block"
                      >
                        View product →
                      </Link>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#C9A961] whitespace-nowrap">
                    ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}

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
      </div>
    </main>
  )
}