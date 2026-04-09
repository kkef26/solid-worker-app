import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { phone_number, pin } = await req.json();

    if (!phone_number || !pin) {
      return Response.json({ error: 'Απαιτείται αριθμός τηλεφώνου και PIN' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = phone_number.trim();

    // Look up worker account
    const { data: worker, error } = await supabase
      .from('worker_accounts')
      .select('id, pin_hash, display_name, full_name, is_active, is_manager')
      .eq('phone_number', normalizedPhone)
      .single();

    if (error || !worker) {
      return Response.json({ error: 'Λανθασμένα στοιχεία' }, { status: 401 });
    }

    if (!worker.is_active) {
      return Response.json({ error: 'Ο λογαριασμός είναι ανενεργός' }, { status: 403 });
    }

    // Verify PIN
    const pinMatch = await bcrypt.compare(pin.toString(), worker.pin_hash);
    if (!pinMatch) {
      return Response.json({ error: 'Λανθασμένα στοιχεία' }, { status: 401 });
    }

    // Create session
    const deviceInfo = req.headers.get('user-agent') || 'unknown';
    const { data: session, error: sessionError } = await supabase
      .from('worker_sessions')
      .insert({
        worker_id: worker.id,
        device_info: deviceInfo,
      })
      .select('token, expires_at')
      .single();

    if (sessionError || !session) {
      return Response.json({ error: 'Σφάλμα δημιουργίας συνεδρίας' }, { status: 500 });
    }

    // Update last login
    await supabase
      .from('worker_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', worker.id);

    return Response.json({
      token: session.token,
      expires_at: session.expires_at,
      worker: {
        id: worker.id,
        display_name: worker.display_name,
        full_name: worker.full_name,
        is_manager: worker.is_manager,
      },
    });
  } catch {
    return Response.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 });
  }
}
