import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/workers/list — List all workers (for settings page)
export async function GET() {
  try {
    const { data: workers, error } = await supabase
      .from('worker_accounts')
      .select('id, full_name, display_name, phone_number, is_active, is_manager, role, specialty, daily_rate, notes, last_login_at, created_at')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ workers: workers || [] })
  } catch (err) {
    console.error('List workers error:', err)
    return NextResponse.json({ error: 'Σφάλμα' }, { status: 500 })
  }
}
