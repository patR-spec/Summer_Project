import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg hover:text-gray-700">
          OKGenie
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            Browse
          </Link>
          <Link href="/admin/upload" className="text-gray-500 hover:text-gray-900">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}