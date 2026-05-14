import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { model_id } = await request.json()
    if (!model_id) {
      return NextResponse.json({ error: 'Missing model_id' }, { status: 400 })
    }

    // Verify the model exists and is published (use the user's session)
    const supabase = await createClient()
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('id, title, our_price_cents, preview_image_urls, is_published')
      .eq('id', model_id)
      .eq('is_published', true)
      .single()

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Get the current user (might be null — guest checkout is fine)
    const { data: { user } } = await supabase.auth.getUser()

    // Use a service-role client to insert the order (bypasses RLS for the system insert)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create a pending order row
    const { data: order, error: orderError } = await serviceSupabase
      .from('orders')
      .insert({
        user_id: user?.id ?? null,
        model_id: model.id,
        status: 'pending_payment',
        total_cents: model.our_price_cents,
        shipping_address: {}, // Stripe will collect this
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 })
    }

    // Get the site URL — use the request's origin so it works locally and in prod
    const origin = request.headers.get('origin') ?? 'http://localhost:3001'

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: model.our_price_cents,
            product_data: {
              name: model.title,
              images: model.preview_image_urls?.slice(0, 1) ?? [],
            },
          },
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ['US'], // start US-only; expand later
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/models/${model.id}`,
      metadata: {
        order_id: order.id,
      },
    })

    // Save the Stripe session ID on the order so we can look it up later
    await serviceSupabase
      .from('orders')
      .update({ stripe_payment_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ checkout_url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}