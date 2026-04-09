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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const manager = await getManager(request)
  if (!manager) return NextResponse.json({ error: 'Μη εξουσιοδοτημένος' }, { status: 401 })

  try {
    const { status, review_note } = await request.json()

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Μη έγκυρη κατάσταση' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('worker_photos')
      .update({
        status,
        reviewed_by: manager.id,
        review_note: review_note ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('Photo approval error:', err)
    return NextResponse.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 })
  }
}
