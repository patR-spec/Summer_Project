import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit'


type CartLine = {
  model_id: string
  quantity: number
}

export async function POST(request: Request) {
    // Rate limit: 10 checkout attempts per IP per 5 minutes
    const rateLimitKey = getRateLimitKey(request, 'checkout')
    const rateLimit = checkRateLimit({
      key: rateLimitKey,
      limit: 10,
      windowMs: 5 * 60 * 1000,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please wait a few minutes and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  
    try {
      // ...rest of your existing code
    const body = await request.json()

    // Accept either single-item ({ model_id }) or multi-item ({ items: [...] })
    let lines: CartLine[] = []
    if (body.items && Array.isArray(body.items)) {
      lines = body.items
        .filter((i: any) => i?.model_id && typeof i.quantity === 'number' && i.quantity > 0)
        .map((i: any) => ({ model_id: i.model_id, quantity: Math.min(i.quantity, 50) }))
    } else if (body.model_id) {
      lines = [{ model_id: body.model_id, quantity: 1 }]
    }

    if (lines.length === 0) {
        return NextResponse.json({ error: 'No items in request' }, { status: 400 })
      }
      if (lines.length > 50) {
        return NextResponse.json({ error: 'Too many items in cart' }, { status: 400 })
      }

    // Verify all models exist and are published (use user's session)
    const supabase = await createClient()
    const modelIds = lines.map((l) => l.model_id)

    const { data: models, error: modelError } = await supabase
      .from('models')
      .select('id, title, our_price_cents, preview_image_urls, is_published')
      .in('id', modelIds)
      .eq('is_published', true)

    if (modelError) {
      return NextResponse.json({ error: 'Failed to load models' }, { status: 500 })
    }
    if (!models || models.length !== lines.length) {
      return NextResponse.json({ error: 'Some items are unavailable' }, { status: 400 })
    }

    // Pair lines with their model data, preserving cart order
    const enriched = lines.map((line) => {
      const m = models.find((x) => x.id === line.model_id)!
      return { ...line, model: m }
    })

    const totalCents = enriched.reduce(
      (sum, e) => sum + e.model.our_price_cents * e.quantity,
      0
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Service-role client for system inserts
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create the order shell
    const { data: order, error: orderError } = await service
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        model_id: lines.length === 1 ? lines[0].model_id : null,
        status: 'pending_payment',
        total_cents: totalCents,
        shipping_address: {},
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
    }

    // Create order_items rows
    const orderItems = enriched.map((e) => ({
      order_id: order.id,
      model_id: e.model.id,
      quantity: e.quantity,
      unit_price_cents: e.model.our_price_cents,
      title_snapshot: e.model.title,
      preview_image_url: e.model.preview_image_urls?.[0] ?? null,
    }))

    const { error: itemsError } = await service.from('order_items').insert(orderItems)

    if (itemsError) {
      console.error('Order items creation failed:', itemsError)
      return NextResponse.json({ error: 'Could not create order items' }, { status: 500 })
    }

    // Build Stripe line items
    const stripeLineItems = enriched.map((e) => ({
      price_data: {
        currency: 'usd',
        unit_amount: e.model.our_price_cents,
        product_data: {
          name: e.model.title,
          images: e.model.preview_image_urls?.slice(0, 1) ?? [],
        },
      },
      quantity: e.quantity,
    }))

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: stripeLineItems,
        shipping_address_collection: { allowed_countries: ['US'] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 600, currency: 'usd' },
              display_name: 'Standard shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 3 },
                maximum: { unit: 'business_day', value: 7 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 1200, currency: 'usd' },
              display_name: 'Express shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 1 },
                maximum: { unit: 'business_day', value: 3 },
              },
            },
          },
        ],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        metadata: {
          order_id: order.id,
        },
      })

    await service
      .from('orders')
      .update({ stripe_payment_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ checkout_url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}