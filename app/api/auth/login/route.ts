import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { phone_number, pin } = await req.json();

    if (!phone_number || !pin) {
      return NextResponse.json({ error: "Απαιτούνται τηλέφωνο και PIN" }, { status: 400 });
    }

    // Find worker account
    const { data: worker, error } = await supabase
      .from("worker_accounts")
      .select("id, phone_number, pin_hash, display_name, full_name, is_active, is_manager")
      .eq("phone_number", phone_number)
      .single();

    if (error || !worker) {
      return NextResponse.json({ error: "Λάθος τηλέφωνο ή PIN" }, { status: 401 });
    }

    if (!worker.is_active) {
      return NextResponse.json({ error: "Ο λογαριασμός είναι ανενεργός" }, { status: 403 });
    }

    // Verify PIN
    const valid = await bcrypt.compare(pin, worker.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: "Λάθος τηλέφωνο ή PIN" }, { status: 401 });
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("worker_sessions")
      .insert({
        worker_id: worker.id,
        device_info: req.headers.get("user-agent") || "",
      })
      .select("token")
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Σφάλμα δημιουργίας συνεδρίας" }, { status: 500 });
    }

    // Update last login
    await supabase
      .from("worker_accounts")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", worker.id);

    return NextResponse.json({
      token: session.token,
      worker_id: worker.id,
      display_name: worker.display_name,
      full_name: worker.full_name,
      is_manager: worker.is_manager,
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα" }, { status: 500 });
  }
}
