import { getSessionWorker } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function OverviewPage() {
  const manager = await getSessionWorker()
  if (!manager) redirect('/worker/login')
  if (!manager.is_manager) redirect('/worker/dashboard')

  const today = new Date().toISOString().split('T')[0]

  const [workersRes, assignmentsRes, pendingPhotosRes] = await Promise.all([
    supabase.from('worker_accounts').select('*').eq('is_active', true).eq('is_manager', false),
    supabase.from('worker_assignments').select('*, worker_accounts(display_name, full_name)').eq('assigned_date', today),
    supabase.from('worker_photos').select('id', { count: 'exact' }).eq('status', 'pending'),
  ])

  const workers = workersRes.data ?? []
  const assignments = assignmentsRes.data ?? []
  const pendingCount = pendingPhotosRes.count ?? 0

  // Build worker → assignments map
  const workerAssignments = new Map<string, typeof assignments>()
  for (const a of assignments) {
    const arr = workerAssignments.get(a.worker_id) ?? []
    arr.push(a)
    workerAssignments.set(a.worker_id, arr)
  }

  // Get today's checkins
  const { data: checkins } = await supabase
    .from('worker_checkins')
    .select('worker_id, checkin_type, created_at')
    .gte('created_at', today + 'T00:00:00Z')

  const workerLastCheckin = new Map<string, string>()
  for (const c of (checkins ?? [])) {
    workerLastCheckin.set(c.worker_id, c.checkin_type)
  }

  const todayDate = new Date().toLocaleDateString('el-GR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="min-h-screen bg-solid-concrete pb-24">
      <div className="bg-solid-blue px-6 pt-12 pb-8">
        <p className="text-white/60 text-sm capitalize mb-1">{todayDate}</p>
        <h1 className="text-white font-heading font-700 text-2xl">Επισκόπηση</h1>
        <div className="flex gap-4 mt-3">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-heading font-700 text-2xl">{workers.length}</p>
            <p className="text-white/60 text-xs">Εργάτες</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-heading font-700 text-2xl">{assignments.length}</p>
            <p className="text-white/60 text-xs">Εργασίες</p>
          </div>
          {pendingCount > 0 && (
            <Link href="/manager/approvals" className="bg-yellow-400 rounded-xl px-4 py-2 text-center">
              <p className="text-yellow-900 font-heading font-700 text-2xl">{pendingCount}</p>
              <p className="text-yellow-900/70 text-xs">Εκκρεμή</p>
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-3">
        {workers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">Δεν υπάρχουν ενεργοί εργάτες</p>
          </div>
        ) : (
          workers.map(worker => {
            const wJobs = workerAssignments.get(worker.id) ?? []
            const lastCheckin = workerLastCheckin.get(worker.id)
            const isOnSite = lastCheckin === 'start' || lastCheckin === 'break_end'
            const onBreak = lastCheckin === 'break_start'
            const finished = lastCheckin === 'end'

            return (
              <div key={worker.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-700 text-sm ${
                    isOnSite ? 'bg-solid-green' : onBreak ? 'bg-yellow-400' : finished ? 'bg-gray-300' : 'bg-gray-200'
                  }`}>
                    {worker.display_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-700 text-solid-blue">{worker.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {isOnSite ? '🟢 Στο εργοτάξιο' :
                       onBreak ? '⏸️ Διάλειμμα' :
                       finished ? '✅ Ολοκλήρωσε' :
                       lastCheckin ? '⚪ Εκτός' : '⚪ Δεν παρουσιάστηκε'}
                    </p>
                  </div>
                  {wJobs.length > 0 && (
                    <span className="bg-solid-concrete text-solid-blue text-xs font-heading font-700 px-2 py-1 rounded-lg">
                      {wJobs.length} εργ.
                    </span>
                  )}
                </div>
                {wJobs.map(job => (
                  <div key={job.id} className="ml-13 pl-3 border-l-2 border-solid-concrete">
                    <p className="text-sm text-solid-steel font-600">{job.job_title}</p>
                    <p className="text-xs text-gray-400">📍 {job.job_address}</p>
                  </div>
                ))}
                {wJobs.length === 0 && (
                  <p className="text-xs text-gray-400 italic ml-13">Χωρίς ανάθεση σήμερα</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
