import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// POST /api/workers — Create new worker
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, display_name, phone_number, role, is_manager, specialty, daily_rate, notes, pin } = body

    if (!full_name || !phone_number) {
      return NextResponse.json({ error: 'Απαιτείται όνομα και τηλέφωνο' }, { status: 400 })
    }

    // Check for duplicate phone
    const { data: existing } = await supabase
      .from('worker_accounts')
      .select('id')
      .eq('phone_number', phone_number)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Υπάρχει ήδη λογαριασμός με αυτό το τηλέφωνο' }, { status: 409 })
    }

    const pin_hash = await bcrypt.hash(pin || '1234', 12)

    const { data: worker, error } = await supabase
      .from('worker_accounts')
      .insert({
        full_name,
        display_name: display_name || full_name.split(' ').pop() || full_name,
        phone_number,
        pin_hash,
        role: role || 'worker',
        is_manager: is_manager ?? false,
        is_active: true,
        specialty: specialty || [],
        daily_rate: daily_rate || null,
        notes: notes || null,
      })
      .select('id, full_name, display_name, phone_number, is_active, is_manager, role, specialty, daily_rate, notes, last_login_at, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ worker })
  } catch (err) {
    console.error('Create worker error:', err)
    return NextResponse.json({ error: 'Σφάλμα δημιουργίας' }, { status: 500 })
  }
}
