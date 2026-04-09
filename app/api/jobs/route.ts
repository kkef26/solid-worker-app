import { NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { SESSION_COOKIE } from '@/lib/auth'

async function getManager(request: Request) {
  const token = request.headers.get('cookie')
    ?.split(';')
    .find(c => c.trim().startsWith(SESSION_COOKIE + '='))
    ?.split('=')[1]
  if (!token) return null
  const worker = await validateToken(token)
  if (!worker?.is_manager) return null
  return worker
}

export async function GET(request: Request) {
  const manager = await getManager(request)
  if (!manager) return NextResponse.json({ error: 'Μη εξουσιοδοτημένος' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('worker_assignments')
    .select('*, worker_accounts(display_name, full_name)')
    .eq('assigned_date', date)
    .order('created_at')

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const manager = await getManager(request)
  if (!manager) return NextResponse.json({ error: 'Μη εξουσιοδοτημένος' }, { status: 401 })

  try {
    const body = await request.json()
    const { worker_id, job_title, job_address, job_description, assigned_date, start_time, notes } = body

    if (!worker_id || !job_title || !job_address) {
      return NextResponse.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('worker_assignments')
      .insert({
        worker_id,
        job_title,
        job_address,
        job_description: job_description || null,
        assigned_date: assigned_date ?? new Date().toISOString().split('T')[0],
        start_time: start_time || null,
        notes: notes || null,
        created_by: manager.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Create job error:', err)
    return NextResponse.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 })
  }
}
