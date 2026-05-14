import Link from 'next/link'

type Props = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  return (
    <main className="max-w-xl mx-auto p-6 py-16 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-3xl font-bold mb-2">Thanks for your order!</h1>
      <p className="text-gray-600 mb-6">
        Payment received. We&apos;ll print your model and ship it within 7 days.
      </p>
      {session_id && (
        <p className="text-xs text-gray-400 mb-6">
          Reference: {session_id.slice(0, 20)}...
        </p>
      )}
      <Link href="/" className="text-blue-600 hover:underline">
        Back to catalog
      </Link>
    </main>
  )
}