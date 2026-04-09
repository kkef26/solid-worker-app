import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// TODO: WhatsApp OTP via Twilio Verify (deferred)
// Integration pattern when ready:
//
//   import twilio from 'twilio'
//   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
//   const verification = await client.verify.v2
//     .services(process.env.TWILIO_VERIFY_SERVICE_SID)
//     .verifications.create({ to: phone_number, channel: 'whatsapp' })
//
// For now, returns a stub that stores a 6-digit code in worker_otp_codes.

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { phone_number } = await request.json()
    if (!phone_number) {
      return NextResponse.json({ error: 'Απαιτείται αριθμός τηλεφώνου' }, { status: 400 })
    }

    // Check worker exists
    const { data: worker } = await supabase
      .from('worker_accounts')
      .select('id')
      .eq('phone_number', phone_number)
      .eq('is_active', true)
      .single()

    if (!worker) {
      // Return success to avoid phone enumeration
      return NextResponse.json({ ok: true, message: 'Αν ο αριθμός είναι εγγεγραμμένος, θα λάβετε κωδικό.' })
    }

    const code = generateCode()

    await supabase.from('worker_otp_codes').insert({
      phone_number,
      code,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    // TODO: Send via Twilio Verify WhatsApp channel
    console.log(`[OTP] Code for ${phone_number}: ${code} (not sent — Twilio deferred)`)

    return NextResponse.json({ ok: true, message: 'Αν ο αριθμός είναι εγγεγραμμένος, θα λάβετε κωδικό.' })
  } catch (err) {
    console.error('OTP request error:', err)
    return NextResponse.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 })
  }
}
