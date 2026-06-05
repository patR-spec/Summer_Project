import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Resend's onboarding sender works without domain setup, but emails will
// land in spam often. Replace with 'OKGenie <orders@yourdomain.com>' once
// you set up a custom sending domain.
const FROM = 'OKGenie <onboarding@resend.dev>'

// Admins who should get a notification on every new order.
// Add/remove emails here as your team changes.
const ADMIN_RECIPIENTS = [
  'pxtrick2004@gmail.com']

type OrderItem = {
  title_snapshot: string
  quantity: number
  unit_price_cents: number
}

type OrderEmailData = {
  orderId: string
  totalCents: number
  customerName: string
  customerEmail: string
  shippingAddress: any
  items: OrderItem[]
}

export async function sendCustomerOrderConfirmation(data: OrderEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping customer email')
    return
  }
  if (!data.customerEmail) {
    console.log('No customer email, skipping')
    return
  }

  try {
    const itemRows = data.items
      .map(
        (i) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            ${escapeHtml(i.title_snapshot)} × ${i.quantity}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #C9A961; font-weight: bold;">
            $${((i.unit_price_cents * i.quantity) / 100).toFixed(2)}
          </td>
        </tr>`
      )
      .join('')

    const addr = data.shippingAddress ?? {}
    const addressBlock = [
      addr.line1,
      addr.line2,
      [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
      addr.country,
    ]
      .filter(Boolean)
      .join('<br>')

    await resend.emails.send({
      from: FROM,
      to: data.customerEmail,
      subject: `Order confirmed — ${data.orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: ui-monospace, monospace; max-width: 560px; margin: 0 auto; padding: 32px; color: #1a1a1a;">
          <div style="text-align: center; padding: 24px; background: #DCEBF7; margin-bottom: 24px;">
            <p style="font-size: 11px; letter-spacing: 0.2em; color: #1d3a5a; margin: 0 0 8px 0;">OKGENIE</p>
            <h1 style="font-size: 24px; color: #1d3a5a; margin: 0;">Thanks for your order</h1>
          </div>

          <p style="font-size: 14px; line-height: 1.6;">
            Hi ${escapeHtml(data.customerName || 'there')},<br><br>
            We received your order and payment. We'll print your items and ship them within 7 days. You'll get another email when your package goes out.
          </p>

          <p style="font-size: 11px; letter-spacing: 0.15em; color: #6b7280; text-transform: uppercase; margin-top: 32px; margin-bottom: 12px;">
            Order ${data.orderId.slice(0, 8).toUpperCase()}
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            ${itemRows}
            <tr>
              <td style="padding: 16px 0 0 0; font-weight: bold; color: #1d3a5a;">Total</td>
              <td style="padding: 16px 0 0 0; text-align: right; font-weight: bold; color: #C9A961; font-size: 18px;">
                $${(data.totalCents / 100).toFixed(2)}
              </td>
            </tr>
          </table>

          <p style="font-size: 11px; letter-spacing: 0.15em; color: #6b7280; text-transform: uppercase; margin-top: 32px; margin-bottom: 12px;">
            Shipping to
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #1d3a5a;">
            ${escapeHtml(data.customerName || '')}<br>
            ${addressBlock || '—'}
          </p>

          <p style="font-size: 12px; color: #6b7280; margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee;">
            Questions? Reply to this email or reach us at hello@okgenie.com.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send customer email:', err)
  }
}

export async function sendAdminOrderNotification(data: OrderEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping admin email')
    return
  }

  try {
    const itemList = data.items
      .map((i) => `• ${escapeHtml(i.title_snapshot)} × ${i.quantity}`)
      .join('<br>')

    const addr = data.shippingAddress ?? {}
    const addressBlock = [
      addr.line1,
      addr.line2,
      [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
      addr.country,
    ]
      .filter(Boolean)
      .join('<br>')

    await resend.emails.send({
      from: FROM,
      to: ADMIN_RECIPIENTS,
      subject: `🛎️ New order — $${(data.totalCents / 100).toFixed(2)} — ${data.orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: ui-monospace, monospace; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="color: #1d3a5a; margin: 0 0 16px 0;">New order — start printing</h2>

          <p style="font-size: 13px; line-height: 1.7;">
            <strong>Order:</strong> ${escapeHtml(data.orderId)}<br>
            <strong>Total:</strong> <span style="color: #C9A961; font-weight: bold;">$${(data.totalCents / 100).toFixed(2)}</span><br>
            <strong>Customer:</strong> ${escapeHtml(data.customerName || '—')} (${escapeHtml(data.customerEmail || '—')})
          </p>

          <p style="font-size: 11px; letter-spacing: 0.15em; color: #6b7280; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px;">Items</p>
          <p style="font-size: 13px; line-height: 1.7;">${itemList}</p>

          <p style="font-size: 11px; letter-spacing: 0.15em; color: #6b7280; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px;">Ship to</p>
          <p style="font-size: 13px; line-height: 1.6;">${addressBlock || '—'}</p>

          <p style="margin-top: 24px;">
            <a href="https://summerprojectt.vercel.app/admin/orders/${data.orderId}"
               style="display: inline-block; background: #1d3a5a; color: white; padding: 10px 20px; text-decoration: none; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;">
              View order →
            </a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send admin email:', err)
  }
}

function escapeHtml(s: string): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}