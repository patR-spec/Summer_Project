import { supabase } from '@/lib/supabase.ts'

export default async function Home() {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .limit(5)

  return (
    <main className="p-8 font-mono">
      <h1 className="text-2xl mb-4">Supabase connection test</h1>
      {error ? (
        <div className="text-red-600">
          <p>Error: {error.message}</p>
          <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : (
        <div>
          <p className="text-green-700 mb-2">Connected. Got {data?.length ?? 0} rows.</p>
          <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </main>
  )
}