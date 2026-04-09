import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// TODO: WhatsApp OTP via Twilio Verify
// Pattern:
//   const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//   await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
//     .verifications.create({ to: phone_number, channel: 'whatsapp' });
// Verify: await client.verify.v2.services(sid).verificationChecks.create({ to, code });

export async function POST(req: NextRequest) {
  try {
    const { phone_number } = await req.json();

    if (!phone_number) {
      return NextResponse.json({ error: "Απαιτείται αριθμός τηλεφώνου" }, { status: 400 });
    }

    // Check worker exists
    const { data: worker } = await supabase
      .from("worker_accounts")
      .select("id, is_active")
      .eq("phone_number", phone_number)
      .single();

    if (!worker || !worker.is_active) {
      // Return success anyway (security: don't reveal if number exists)
      return NextResponse.json({ message: "Αν ο αριθμός είναι εγγεγραμμένος, θα λάβετε OTP" });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    await supabase.from("worker_otp_codes").insert({
      phone_number,
      code,
    });

    // TODO: Send via WhatsApp (Twilio Verify) — currently deferred
    console.log(`[OTP] ${phone_number}: ${code}`);

    return NextResponse.json({ message: "Αν ο αριθμός είναι εγγεγραμμένος, θα λάβετε OTP" });
  } catch (e) {
    console.error("OTP error:", e);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα" }, { status: 500 });
  }
}
