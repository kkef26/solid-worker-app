import { getSessionWorker } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getPresignedViewUrl } from '@/lib/s3'
import { redirect } from 'next/navigation'
import ApprovalCard from './ApprovalCard'

export default async function ApprovalsPage() {
  const manager = await getSessionWorker()
  if (!manager) redirect('/worker/login')
  if (!manager.is_manager) redirect('/worker/dashboard')

  const { data: photos } = await supabase
    .from('worker_photos')
    .select(`
      *,
      worker_accounts(display_name, full_name),
      worker_assignments(job_title, job_address)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Attach presigned view URLs
  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (p) => ({
      ...p,
      view_url: await getPresignedViewUrl(p.s3_key).catch(() => null),
    }))
  )

  return (
    <div className="min-h-screen bg-solid-concrete pb-24">
      <div className="bg-solid-blue px-6 pt-12 pb-8">
        <h1 className="text-white font-heading font-700 text-2xl">Εγκρίσεις φωτογραφιών</h1>
        <p className="text-white/60 text-sm mt-1">{photosWithUrls.length} εκκρεμή</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {photosWithUrls.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500 font-heading font-600">Δεν υπάρχουν εκκρεμείς εγκρίσεις</p>
          </div>
        ) : (
          photosWithUrls.map(photo => (
            <ApprovalCard key={photo.id} photo={photo} managerId={manager.id} />
          ))
        )}
      </div>
    </div>
  )
}
