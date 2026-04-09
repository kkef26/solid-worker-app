import { supabase, WorkerAccount } from './supabase'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'worker_session'

export async function getSessionWorker(): Promise<WorkerAccount | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return validateToken(token)
}

export async function validateToken(token: string): Promise<WorkerAccount | null> {
  const { data: session } = await supabase
    .from('worker_sessions')
    .select('worker_id, expires_at')
    .eq('token', token)
    .single()

  if (!session) return null
  if (new Date(session.expires_at) < new Date()) return null

  const { data: worker } = await supabase
    .from('worker_accounts')
    .select('*')
    .eq('id', session.worker_id)
    .eq('is_active', true)
    .single()

  return worker ?? null
}
