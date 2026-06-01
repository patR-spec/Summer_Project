import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Stripe needs the raw request body (not parsed JSON) to verify the signature.
// This export tells Next.js to give us the raw body.
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const headerList = await headers()
  const signature = headerList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  // ---------- Verify the signature ----------
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ---------- Idempotency: have we already processed this event? ----------
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existingEvent } = await serviceSupabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  // ---------- Handle the event ----------
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id

        if (!orderId) {
          console.error('checkout.session.completed missing order_id in metadata', session.id)
          break
        }

        // Pull shipping info Stripe collected
        const shippingAddress = (session as any).shipping_details?.address ?? {}
        const shippingName = (session as any).shipping_details?.name ?? ''
        const customerEmail = session.customer_details?.email ?? ''

        const { error: updateError } = await serviceSupabase
          .from('orders')
          .update({
            status: 'paid',
            shipping_address: {
              name: shippingName,
              email: customerEmail,
              ...shippingAddress,
            },
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Failed to mark order paid:', updateError)
          throw updateError
        }

        console.log(`Order ${orderId} marked paid`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        if (orderId) {
          await serviceSupabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId)
          console.log(`Order ${orderId} cancelled (session expired)`)
        }
        break
      }

      // Add more event types as you need them
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // ---------- Record that we processed this event ----------
    await serviceSupabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    // Return 500 so Stripe retries
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}