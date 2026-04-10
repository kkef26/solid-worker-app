import { getSessionWorker } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const worker = await getSessionWorker()
  if (!worker) redirect('/worker/login')
  if (!worker.is_manager) redirect('/worker/dashboard')

  return (
    <div className="min-h-screen bg-solid-concrete">
      {children}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-around">
        <Link href="/manager/overview" className="flex flex-col items-center text-solid-blue">
          <span className="text-xl">👷</span>
          <span className="text-xs font-heading font-600">Επισκόπηση</span>
        </Link>
        <Link href="/manager/approvals" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">✅</span>
          <span className="text-xs font-heading font-600">Εγκρίσεις</span>
        </Link>
        <Link href="/manager/assign" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📋</span>
          <span className="text-xs font-heading font-600">Ανάθεση</span>
        </Link>
        <Link href="/manager/settings" className="flex flex-col items-center text-gray-400">
          <span className="text-xl">⚙️</span>
          <span className="text-xs font-heading font-600">Ρυθμίσεις</span>
        </Link>
      </div>
    </div>
  )
}
