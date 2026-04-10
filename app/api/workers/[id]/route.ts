import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// PUT /api/workers/:id — Update worker
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const update: Record<string, unknown> = {}

    // Only set fields that were provided
    if (body.full_name !== undefined) update.full_name = body.full_name
    if (body.display_name !== undefined) update.display_name = body.display_name
    if (body.phone_number !== undefined) update.phone_number = body.phone_number
    if (body.role !== undefined) update.role = body.role
    if (body.is_manager !== undefined) update.is_manager = body.is_manager
    if (body.is_active !== undefined) update.is_active = body.is_active
    if (body.specialty !== undefined) update.specialty = body.specialty
    if (body.daily_rate !== undefined) update.daily_rate = body.daily_rate
    if (body.notes !== undefined) update.notes = body.notes

    // Hash new PIN if provided
    if (body.pin && body.pin.length >= 4) {
      update.pin_hash = await bcrypt.hash(body.pin, 12)
    }

    const { data: worker, error } = await supabase
      .from('worker_accounts')
      .update(update)
      .eq('id', params.id)
      .select('id, full_name, display_name, phone_number, is_active, is_manager, role, specialty, daily_rate, notes, last_login_at, created_at')
      .single()

    if (error) throw error
    if (!worker) return NextResponse.json({ error: 'Δεν βρέθηκε' }, { status: 404 })

    return NextResponse.json({ worker })
  } catch (err) {
    console.error('Update worker error:', err)
    return NextResponse.json({ error: 'Σφάλμα ενημέρωσης' }, { status: 500 })
  }
}
