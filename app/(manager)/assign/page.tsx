import { getSessionWorker } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import AssignForm from './AssignForm'

export default async function AssignPage() {
  const manager = await getSessionWorker()
  if (!manager) redirect('/worker/login')
  if (!manager.is_manager) redirect('/worker/dashboard')

  const { data: workers } = await supabase
    .from('worker_accounts')
    .select('id, display_name, full_name')
    .eq('is_active', true)
    .eq('is_manager', false)
    .order('full_name')

  return (
    <div className="min-h-screen bg-solid-concrete pb-24">
      <div className="bg-solid-blue px-6 pt-12 pb-8">
        <h1 className="text-white font-heading font-700 text-2xl">Ανάθεση εργασίας</h1>
        <p className="text-white/60 text-sm mt-1">Αναθέστε εργασία σε εργάτη</p>
      </div>
      <div className="px-4 py-5">
        <AssignForm workers={workers ?? []} managerId={manager.id} />
      </div>
    </div>
  )
}
