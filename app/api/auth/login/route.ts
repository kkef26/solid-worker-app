import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { phone_number, pin } = await request.json()

    if (!phone_number || !pin) {
      return NextResponse.json({ error: 'Απαιτείται αριθμός και PIN' }, { status: 400 })
    }

    const { data: worker } = await supabase
      .from('worker_accounts')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('is_active', true)
      .single()

    if (!worker) {
      return NextResponse.json({ error: 'Λάθος αριθμός ή PIN' }, { status: 401 })
    }

    const valid = await bcrypt.compare(pin, worker.pin_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Λάθος αριθμός ή PIN' }, { status: 401 })
    }

    // Create session
    const { data: session } = await supabase
      .from('worker_sessions')
      .insert({
        worker_id: worker.id,
        device_info: { ua: request.headers.get('user-agent') },
      })
      .select('token, expires_at')
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Σφάλμα δημιουργίας session' }, { status: 500 })
    }

    // Update last login
    await supabase
      .from('worker_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', worker.id)

    const response = NextResponse.json({
      token: session.token,
      worker_id: worker.id,
      display_name: worker.display_name,
      is_manager: worker.is_manager,
    })

    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(session.expires_at),
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 })
  }
}

// Logout
export async function DELETE(request: Request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    await supabase.from('worker_sessions').delete().eq('token', token)
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
