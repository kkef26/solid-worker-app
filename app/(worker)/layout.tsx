import { getSessionWorker } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  // Session check is handled by middleware, but validate here too for server components
  return (
    <div className="min-h-screen bg-solid-concrete">
      {children}
    </div>
  )
}
