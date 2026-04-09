import { getSessionWorker } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import JobActions from './JobActions'

export default async function JobPage({ params }: { params: { id: string } }) {
  const worker = await getSessionWorker()
  if (!worker) redirect('/worker/login')

  const { data: assignment } = await supabase
    .from('worker_assignments')
    .select('*')
    .eq('id', params.id)
    .eq('worker_id', worker.id)
    .single()

  if (!assignment) redirect('/worker/dashboard')

  const { data: checkins } = await supabase
    .from('worker_checkins')
    .select('*')
    .eq('assignment_id', params.id)
    .order('created_at', { ascending: true })

  const { data: photos } = await supabase
    .from('worker_photos')
    .select('id, photo_type, caption, status, s3_key, created_at')
    .eq('assignment_id', params.id)
    .order('created_at', { ascending: false })

  const { data: materials } = await supabase
    .from('worker_materials')
    .select('*')
    .eq('assignment_id', params.id)
    .order('created_at', { ascending: false })

  const checkinTypes = (checkins ?? []).map(c => c.checkin_type)
  const hasStarted = checkinTypes.includes('start')
  const hasEnded = checkinTypes.includes('end')

  return (
    <div className="min-h-screen bg-solid-concrete pb-20">
      {/* Header */}
      <div className="bg-solid-blue px-6 pt-12 pb-8">
        <Link href="/worker/dashboard" className="text-white/60 text-sm mb-4 inline-flex items-center gap-1">
          ← Πίσω
        </Link>
        <h1 className="text-white font-heading font-700 text-xl mt-2">{assignment.job_title}</h1>
        <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
          📍 {assignment.job_address}
        </p>
        {assignment.start_time && (
          <p className="text-solid-green text-sm mt-1">🕐 {assignment.start_time.slice(0,5)}</p>
        )}
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Description */}
        {assignment.job_description && (
          <div className="card">
            <h3 className="font-heading font-700 text-solid-blue text-sm mb-2">Περιγραφή</h3>
            <p className="text-gray-600 text-sm">{assignment.job_description}</p>
          </div>
        )}

        {/* Notes */}
        {assignment.notes && (
          <div className="card bg-yellow-50 border border-yellow-200">
            <p className="text-yellow-800 text-sm">📝 {assignment.notes}</p>
          </div>
        )}

        {/* GPS Check-in actions */}
        <JobActions
          assignmentId={params.id}
          hasStarted={hasStarted}
          hasEnded={hasEnded}
          onBreak={checkinTypes.includes('break_start') && !checkinTypes.includes('break_end')}
        />

        {/* Check-in history */}
        {(checkins ?? []).length > 0 && (
          <div className="card">
            <h3 className="font-heading font-700 text-solid-blue text-sm mb-3">Ιστορικό</h3>
            <div className="space-y-2">
              {checkins!.map(c => (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{checkinTypeIcon(c.checkin_type)}</span>
                  <div>
                    <span className="font-600 text-solid-steel">{checkinTypeLabel(c.checkin_type)}</span>
                    <span className="text-gray-400 ml-2">
                      {new Date(c.created_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-700 text-solid-blue text-sm">Φωτογραφίες</h3>
            <span className="text-xs text-gray-400">{(photos ?? []).length} φωτ.</span>
          </div>
          {(photos ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Δεν υπάρχουν φωτογραφίες</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos!.slice(0, 6).map(p => (
                <div key={p.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  <div className="absolute bottom-1 right-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      p.status === 'approved' ? 'bg-green-500 text-white' :
                      p.status === 'rejected' ? 'bg-red-500 text-white' :
                      'bg-yellow-400 text-yellow-900'
                    }`}>
                      {p.status === 'approved' ? '✓' : p.status === 'rejected' ? '✗' : '⏳'}
                    </span>
                  </div>
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {photoTypeIcon(p.photo_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Materials */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-700 text-solid-blue text-sm">Υλικά</h3>
            <span className="text-xs text-gray-400">{(materials ?? []).length} αντικείμενα</span>
          </div>
          {(materials ?? []).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Δεν έχουν καταγραφεί υλικά</p>
          ) : (
            <div className="space-y-2">
              {materials!.map(m => (
                <div key={m.id} className="flex justify-between text-sm">
                  <span className="text-solid-steel">{m.material_name}</span>
                  <span className="text-gray-500">{m.quantity} {m.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function checkinTypeLabel(t: string) {
  const map: Record<string, string> = {
    start: 'Έναρξη',
    end: 'Λήξη',
    break_start: 'Αρχή διαλείμματος',
    break_end: 'Τέλος διαλείμματος',
  }
  return map[t] ?? t
}

function checkinTypeIcon(t: string) {
  const map: Record<string, string> = {
    start: '🟢',
    end: '🔴',
    break_start: '⏸️',
    break_end: '▶️',
  }
  return map[t] ?? '⚪'
}

function photoTypeIcon(t: string) {
  const map: Record<string, string> = {
    before: '🔍',
    during: '🔨',
    after: '✅',
    material: '📦',
    issue: '⚠️',
  }
  return map[t] ?? '📷'
}
