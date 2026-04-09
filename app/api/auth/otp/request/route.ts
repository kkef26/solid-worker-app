import { NextRequest } from 'next/server';

// TODO: WhatsApp OTP via Twilio Verify — deferred
// Pattern when ready:
//   1. POST to https://verify.twilio.com/v2/Services/{SERVICE_SID}/Verifications
//      Body: To=+306900000001&Channel=whatsapp
//   2. User receives WhatsApp message with 6-digit code
//   3. POST to /v2/Services/{SERVICE_SID}/VerificationChecks
//      Body: To=+306900000001&Code=123456
//   4. On approved: create session same as PIN login
// env vars needed: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID

export async function POST(req: NextRequest) {
  const { phone_number } = await req.json();

  if (!phone_number) {
    return Response.json({ error: 'Απαιτείται αριθμός τηλεφώνου' }, { status: 400 });
  }

  // OTP via WhatsApp not yet implemented
  return Response.json(
    { error: 'Η σύνδεση μέσω WhatsApp δεν είναι ακόμα διαθέσιμη. Χρησιμοποιήστε το PIN.' },
    { status: 501 }
  );
}
