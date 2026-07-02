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
        className="text-xs uppercase tracking-wider text-gray-500 hover:text-[#C9A961] inline-block mb-6"
      >
        ← Back to orders
      </Link>

      <div className="border-b border-white/10 pb-6 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Order</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
          {order.id.slice(0, 8)}
        </h1>
        <p className="text-xs text-gray-500 mt-2">
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
            <p className="text-sm text-gray-500 mb-6">No items recorded.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-b-0">
                  {item.preview_image_url ? (
                    <img
                      src={item.preview_image_url}
                      alt={item.title_snapshot}
                      className="w-20 h-20 object-cover bg-[#0c1520] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-[#1a1d24] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{item.title_snapshot}</p>
                    <p className="text-xs text-gray-500 mt-1">
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
          {(() => {
            const subtotal = items.reduce(
              (sum: number, i: any) => sum + i.unit_price_cents * i.quantity,
              0
            )
            const shipping = order.shipping_cents ?? 0
            return (
              <div className="mb-6 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-200">${(subtotal / 100).toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Shipping {order.shipping_method ? `(${order.shipping_method})` : ''}
                    </span>
                    <span className="text-gray-200">${(shipping / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                  <span className="text-xs uppercase tracking-wider text-gray-300">Total</span>
                  <span className="text-xl font-bold text-[#C9A961]">
                    ${(order.total_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })()}

          {order.stripe_payment_id && (
            <a
              href={`https://dashboard.stripe.com/test/checkout/sessions/${order.stripe_payment_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-wider text-gray-500 hover:text-[#C9A961]"
            >
              View in Stripe ↗
            </a>
          )}
        </div>

        {/* Shipping */}
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C9A961] mb-3">Ship to</p>
          <div className="text-sm text-gray-200 space-y-1">
            <p>{addr.name ?? '—'}</p>
            <p className="text-gray-500">{addr.email ?? '—'}</p>
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
              <p className="text-sm text-gray-200">{order.estimated_ship_date}</p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 mt-12 pt-6 text-xs text-gray-500 font-mono">
        <p>Order ID: {order.id}</p>
        {order.stripe_payment_id && <p>Stripe ID: {order.stripe_payment_id}</p>}
        {order.user_id && <p>User ID: {order.user_id}</p>}
      </div>
    </main>
  )
}
