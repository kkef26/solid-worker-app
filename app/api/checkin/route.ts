import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await req.json();
    const { assignment_id, checkin_type, latitude, longitude, accuracy_meters, notes } = body;

    if (!assignment_id || !checkin_type) {
      return NextResponse.json({ error: "Απαιτούνται assignment_id και checkin_type" }, { status: 400 });
    }

    const validTypes = ["start", "end", "break_start", "break_end"];
    if (!validTypes.includes(checkin_type)) {
      return NextResponse.json({ error: "Μη έγκυρος τύπος παρουσίας" }, { status: 400 });
    }

    const workerId = authResult.session.worker_id;

    // Verify assignment belongs to this worker
    const { data: assignment } = await supabase
      .from("worker_assignments")
      .select("id")
      .eq("id", assignment_id)
      .eq("worker_id", workerId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Η ανάθεση δεν βρέθηκε" }, { status: 404 });
    }

    const { data: checkin, error } = await supabase
      .from("worker_checkins")
      .insert({
        assignment_id,
        worker_id: workerId,
        checkin_type,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        accuracy_meters: accuracy_meters ?? null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Σφάλμα καταγραφής παρουσίας" }, { status: 500 });
    }

    return NextResponse.json({ checkin }, { status: 201 });
  } catch (e) {
    console.error("Checkin error:", e);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα" }, { status: 500 });
  }
}
