import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import UploadForm from './upload-form'

export default async function AdminUploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → kick to login
  if (!user) {
    redirect('/login')
  }

  // Logged in but not admin → kick to home
  const role = user.user_metadata?.role
  if (role !== 'admin') {
    redirect('/')
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-6 font-bold">Add a new model</h1>
      <p className="text-sm text-gray-600 mb-6">Logged in as {user.email}</p>
      <UploadForm />
    </main>
  )
}