import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import StatusDropdown from './status-dropdown'

export const dynamic = 'force-dynamic'


type OrderRow = {
    id: string
    status: string
    total_cents: number
    shipping_address: any
    stripe_payment_id: string | null
    estimated_ship_date: string | null
    created_at: string
    model_id: string | null
    user_id: string | null
    models: { title: string; preview_image_urls: string[] | null } | null
    order_items: { quantity: number; title_snapshot: string; preview_image_url: string | null }[]
  }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  if (process.env.NODE_ENV !== 'development') redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.user_metadata?.role !== 'admin') redirect('/')

  const { status: statusFilter } = await searchParams

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = service
    .from('orders')
    .select('id, status, total_cents, shipping_address, stripe_payment_id, estimated_ship_date, created_at, model_id, user_id, models(title, preview_image_urls), order_items(quantity, title_snapshot, preview_image_url)')
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: ordersRaw, error } = await query
  const orders = (ordersRaw ?? []) as unknown as OrderRow[]

  // Group counts by status for the filter pills
  const { data: allOrders } = await service
    .from('orders')
    .select('status')

  const statusCounts: Record<string, number> = { all: allOrders?.length ?? 0 }
  for (const o of allOrders ?? []) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
  }

  const statusOptions = [
    'all', 'pending_payment', 'paid', 'printing', 'shipped', 'delivered', 'cancelled', 'refunded',
  ]

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="border-b border-white/10 pb-6 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Admin</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Orders
        </h1>
        <p className="text-xs text-gray-500 mt-2">
          Logged in as {user.email}
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((s) => {
          const active = (statusFilter ?? 'all') === s
          const count = statusCounts[s] ?? 0
          return (
            <Link
              key={s}
              href={s === 'all' ? '/admin/orders' : `/admin/orders?status=${s}`}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                active
                  ? 'border-[#C9A961] bg-[#C9A961] text-[#0A0A0C]'
                  : 'border-white/10 text-gray-300 hover:border-[#C9A961] hover:text-[#C9A961]'
              }`}
            >
              {s.replace('_', ' ')} ({count})
            </Link>
          )
        })}
      </div>

      {error && (
        <p className="text-red-400 text-sm">Error loading: {error.message}</p>
      )}

      {!orders || orders.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-16">
          No orders {statusFilter && statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}.
        </p>
      ) : (
        <div className="border border-white/10">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 bg-[#0c1520] text-xs uppercase tracking-wider text-gray-400">
            <div className="col-span-1">Image</div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Item</div>
            <div className="col-span-2">Ship to</div>
            <div className="col-span-1">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {orders.map((order) => {
            const addr = order.shipping_address ?? {}
            const customerName = addr.name ?? '—'
            const customerEmail = addr.email ?? '—'
            const city = addr.city ?? ''
            const state = addr.state ?? ''
            const created = new Date(order.created_at)

            return (
              <div
                key={order.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border-b last:border-b-0 border-white/10 items-center"
              >
                <div className="md:col-span-1">
                  {(order.order_items?.[0]?.preview_image_url ?? order.models?.preview_image_urls?.[0]) ? (
                    <img
                      src={order.order_items?.[0]?.preview_image_url ?? order.models?.preview_image_urls?.[0] ?? ''}
                      alt=""
                      className="w-12 h-12 object-cover bg-[#0c1520]"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#1a1d24] flex items-center justify-center text-xs text-gray-600">
                      —
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 font-mono">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {' · '}
                    {created.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>

                <div className="md:col-span-2">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.length === 1 ? (
                      <p className="text-sm text-gray-200 truncate">
                        {order.order_items[0].title_snapshot}
                        {order.order_items[0].quantity > 1 && ` × ${order.order_items[0].quantity}`}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-200">
                          {order.order_items.reduce((s, i) => s + i.quantity, 0)} items
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {order.order_items.map((i) => i.title_snapshot).join(', ')}
                        </p>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-gray-200 truncate">
                      {order.models?.title ?? 'Custom request'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 text-xs">
                  <p className="text-gray-200 truncate">{customerName}</p>
                  <p className="text-gray-500 truncate">{customerEmail}</p>
                  {city && (
                    <p className="text-gray-500 truncate">{city}{state ? `, ${state}` : ''}</p>
                  )}
                </div>

                <div className="md:col-span-1 text-sm font-bold text-[#C9A961]">
                  ${(order.total_cents / 100).toFixed(2)}
                </div>

                <div className="md:col-span-2">
                  <StatusDropdown orderId={order.id} currentStatus={order.status} />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 text-xs uppercase tracking-wider">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-gray-300 hover:text-[#C9A961]"
                  >
                    View
                  </Link>
                  {order.stripe_payment_id && (
                    <a
                      href={`https://dashboard.stripe.com/test/checkout/sessions/${order.stripe_payment_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-[#C9A961]"
                    >
                      Stripe ↗
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-6">
        {orders.length} of {statusCounts.all} total orders
      </p>
    </main>
  )
}
