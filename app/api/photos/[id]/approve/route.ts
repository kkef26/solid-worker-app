import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireManager(req);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { approved, review_note } = await req.json();
    const photoId = params.id;
    const managerId = authResult.session.worker_id;

    const { data, error } = await supabase
      .from("worker_photos")
      .update({
        status: approved ? "approved" : "rejected",
        reviewed_by: managerId,
        review_note: review_note || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", photoId)
      .eq("status", "pending")
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Η φωτογραφία δεν βρέθηκε ή δεν είναι εκκρεμής" }, { status: 404 });
    }

    return NextResponse.json({ photo: data });
  } catch (e) {
    console.error("Photo approve error:", e);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα" }, { status: 500 });
  }
}
