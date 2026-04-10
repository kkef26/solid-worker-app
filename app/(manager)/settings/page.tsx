import { getSessionWorker } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import WorkerList from './WorkerList'

export default async function SettingsPage() {
  const manager = await getSessionWorker()
  if (!manager) redirect('/worker/login')
  if (!manager.is_manager) redirect('/worker/dashboard')

  const { data: workers } = await supabase
    .from('worker_accounts')
    .select('id, full_name, display_name, phone_number, is_active, is_manager, role, specialty, daily_rate, notes, last_login_at, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-solid-concrete pb-24">
      <div className="bg-solid-blue px-6 pt-12 pb-8">
        <h1 className="text-white font-heading font-700 text-2xl">Ρυθμίσεις</h1>
        <p className="text-white/60 text-sm mt-1">Διαχείριση εργατών & ρόλων</p>
      </div>
      <WorkerList workers={workers ?? []} currentUserId={manager.id} />
    </div>
  )
}
