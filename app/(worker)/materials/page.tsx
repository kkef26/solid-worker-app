import { getSessionWorker } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MaterialsPage() {
  const worker = await getSessionWorker()
  if (!worker) redirect('/worker/login')

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: materials } = await supabase
    .from('worker_materials')
    .select(`
      *,
      worker_assignments(job_title, assigned_date)
    `)
    .eq('worker_id', worker.id)
    .gte('created_at', weekAgo + 'T00:00:00Z')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-solid-concrete pb-20">
      <div className="bg-solid-blue px-6 pt-12 pb-8">
        <h1 className="text-white font-heading font-700 text-2xl">Υλικά</h1>
        <p className="text-white/60 text-sm mt-1">Τελευταίες 7 ημέρες</p>
      </div>

      <div className="px-4 py-5">
        {(!materials || materials.length === 0) ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-500 font-heading font-600">Δεν υπάρχουν καταγεγραμμένα υλικά</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map(m => (
              <div key={m.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-heading font-700 text-solid-blue">{m.material_name}</p>
                    <p className="text-gray-500 text-sm">{m.quantity} {m.unit}</p>
                    {(m as any).worker_assignments && (
                      <p className="text-gray-400 text-xs mt-1">
                        📋 {(m as any).worker_assignments.job_title}
                      </p>
                    )}
                    {m.notes && <p className="text-gray-500 text-xs mt-1">💬 {m.notes}</p>}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around">
        <Link href="/worker/dashboard" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">🏠</span>
          <span className="text-xs font-heading font-600">Αρχική</span>
        </Link>
        <Link href="/worker/materials" className="flex flex-col items-center text-solid-blue">
          <span className="text-xl">📦</span>
          <span className="text-xs font-heading font-600">Υλικά</span>
        </Link>
      </div>
    </div>
  )
}
