import { NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { SESSION_COOKIE } from '@/lib/auth'

async function getWorker(request: Request) {
  const token = request.headers.get('cookie')
    ?.split(';')
    .find(c => c.trim().startsWith(SESSION_COOKIE + '='))
    ?.split('=')[1]
  if (!token) return null
  return validateToken(token)
}

export async function GET(request: Request) {
  const worker = await getWorker(request)
  if (!worker) return NextResponse.json({ error: 'Μη εξουσιοδοτημένος' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get('assignment_id')

  let query = supabase
    .from('worker_materials')
    .select('*')
    .eq('worker_id', worker.id)
    .order('created_at', { ascending: false })

  if (assignmentId) query = query.eq('assignment_id', assignmentId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const worker = await getWorker(request)
  if (!worker) return NextResponse.json({ error: 'Μη εξουσιοδοτημένος' }, { status: 401 })

  try {
    const { assignment_id, material_name, quantity, unit, notes } = await request.json()

    if (!assignment_id || !material_name || !quantity || !unit) {
      return NextResponse.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 })
    }

    // Verify assignment
    const { data: assignment } = await supabase
      .from('worker_assignments')
      .select('id')
      .eq('id', assignment_id)
      .eq('worker_id', worker.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Η εργασία δεν βρέθηκε' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('worker_materials')
      .insert({
        assignment_id,
        worker_id: worker.id,
        material_name,
        quantity: parseFloat(quantity),
        unit,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Material error:', err)
    return NextResponse.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 })
  }
}
