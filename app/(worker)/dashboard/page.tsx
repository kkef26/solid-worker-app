import { getSessionWorker } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const worker = await getSessionWorker()
  if (!worker) redirect('/worker/login')
  if (worker.is_manager) redirect('/manager/overview')

  const today = new Date().toISOString().split('T')[0]

  const { data: assignments } = await supabase
    .from('worker_assignments')
    .select('*')
    .eq('worker_id', worker.id)
    .eq('assigned_date', today)
    .order('created_at', { ascending: true })

  const { data: checkins } = await supabase
    .from('worker_checkins')
    .select('assignment_id, checkin_type, created_at')
    .eq('worker_id', worker.id)
    .gte('created_at', today + 'T00:00:00Z')

  const checkinMap = new Map<string, string[]>()
  for (const c of (checkins ?? [])) {
    const arr = checkinMap.get(c.assignment_id) ?? []
    arr.push(c.checkin_type)
    checkinMap.set(c.assignment_id, arr)
  }

  const todayDate = new Date().toLocaleDateString('el-GR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="min-h-screen bg-solid-concrete">
      {/* Header */}
      <div className="bg-solid-blue px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white/60 text-sm capitalize">{todayDate}</p>
          <LogoutButton />
        </div>
        <h1 className="text-white font-heading font-700 text-2xl">
          Καλημέρα, {worker.display_name}
        </h1>
        <p className="text-solid-green text-sm mt-1">
          {assignments?.length ?? 0} εργασίες σήμερα
        </p>
      </div>

      {/* Job cards */}
      <div className="px-4 py-6 space-y-4">
        {(!assignments || assignments.length === 0) ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🏗️</div>
            <p className="text-gray-500 font-heading font-600">Δεν υπάρχουν εργασίες σήμερα</p>
            <p className="text-gray-400 text-sm mt-1">Επικοινωνήστε με τον διαχειριστή</p>
          </div>
        ) : (
          assignments.map(job => {
            const jobCheckins = checkinMap.get(job.id) ?? []
            const hasStarted = jobCheckins.includes('start')
            const hasEnded = jobCheckins.includes('end')

            return (
              <Link href={`/worker/job/${job.id}`} key={job.id}>
                <div className="card border border-transparent hover:border-solid-green transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-heading font-700 text-solid-blue text-lg leading-tight">
                        {job.job_title}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                        <span>📍</span> {job.job_address}
                      </p>
                    </div>
                    <StatusBadge started={hasStarted} ended={hasEnded} />
                  </div>

                  {job.job_description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.job_description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {job.start_time && (
                      <span className="text-xs text-gray-400">🕐 {job.start_time.slice(0,5)}</span>
                    )}
                    <span className={`ml-auto text-sm font-heading font-700 px-4 py-2 rounded-xl ${
                      hasEnded
                        ? 'bg-gray-100 text-gray-400'
                        : hasStarted
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-solid-green text-white'
                    }`}>
                      {hasEnded ? 'Ολοκληρώθηκε' : hasStarted ? 'Σε εξέλιξη →' : 'ΠΑΡΟΥΣΙΑΣΗ →'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around">
        <Link href="/worker/dashboard" className="flex flex-col items-center text-solid-blue">
          <span className="text-xl">🏠</span>
          <span className="text-xs font-heading font-600">Αρχική</span>
        </Link>
        <Link href="/worker/materials" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📦</span>
          <span className="text-xs font-heading font-600">Υλικά</span>
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ started, ended }: { started: boolean; ended: boolean }) {
  if (ended) return <span className="w-3 h-3 rounded-full bg-gray-300 mt-1" />
  if (started) return <span className="w-3 h-3 rounded-full bg-yellow-400 mt-1 animate-pulse" />
  return <span className="w-3 h-3 rounded-full bg-solid-green mt-1" />
}
