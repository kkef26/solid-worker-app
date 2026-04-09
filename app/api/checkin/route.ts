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

export async function POST(request: Request) {
  const worker = await getWorker(request)
  if (!worker) return NextResponse.json({ error: 'Μη εξουσιοδοτημένος' }, { status: 401 })

  try {
    const body = await request.json()
    const { assignment_id, checkin_type, latitude, longitude, accuracy_meters, notes } = body

    if (!assignment_id || !checkin_type) {
      return NextResponse.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 })
    }

    const VALID_TYPES = ['start', 'end', 'break_start', 'break_end']
    if (!VALID_TYPES.includes(checkin_type)) {
      return NextResponse.json({ error: 'Μη έγκυρος τύπος check-in' }, { status: 400 })
    }

    // Verify assignment belongs to worker
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
      .from('worker_checkins')
      .insert({
        assignment_id,
        worker_id: worker.id,
        checkin_type,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        accuracy_meters: accuracy_meters ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Checkin error:', err)
    return NextResponse.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 })
  }
}
