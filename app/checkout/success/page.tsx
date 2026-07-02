import Link from 'next/link'
import CartClearer from './cart-clearer'

type Props = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  return (
    <main className="max-w-xl mx-auto p-6 py-16 text-center">
      <CartClearer />
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
        Thanks for your order!
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        Payment received. We&apos;ll print your model and ship it within 7 days.
      </p>
      {session_id && (
        <p className="text-xs text-gray-500 mb-6 font-mono">
          Reference: {session_id.slice(0, 20)}...
        </p>
      )}
      <Link
        href="/"
        className="inline-flex items-center gap-2 border border-[#C9A961] text-white px-6 py-3 text-xs uppercase tracking-wider hover:bg-[#C9A961] hover:text-[#0A0A0C] transition-colors"
      >
        Back to catalog
        <span>→</span>
      </Link>
    </main>
  )
}
