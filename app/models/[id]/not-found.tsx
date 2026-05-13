import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto p-6 text-center py-16">
      <h1 className="text-2xl font-bold mb-2">Model not found</h1>
      <p className="text-gray-600 mb-6">
        This model doesn&apos;t exist or isn&apos;t available right now.
      </p>
      <Link href="/" className="text-blue-600 hover:underline">
        ← Back to catalog
      </Link>
    </main>
  )
}