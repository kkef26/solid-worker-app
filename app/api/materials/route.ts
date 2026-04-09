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
    const { assignment_id, material_name, quantity, unit, notes } = body;

    if (!assignment_id || !material_name || !quantity || !unit) {
      return NextResponse.json({ error: "Λείπουν απαιτούμενα πεδία" }, { status: 400 });
    }

    if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return NextResponse.json({ error: "Μη έγκυρη ποσότητα" }, { status: 400 });
    }

    const workerId = authResult.session.worker_id;

    // Verify assignment belongs to worker
    const { data: assignment } = await supabase
      .from("worker_assignments")
      .select("id")
      .eq("id", assignment_id)
      .eq("worker_id", workerId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Η ανάθεση δεν βρέθηκε" }, { status: 404 });
    }

    const { data: material, error } = await supabase
      .from("worker_materials")
      .insert({
        assignment_id,
        worker_id: workerId,
        material_name,
        quantity: Number(quantity),
        unit,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Σφάλμα καταχώρησης υλικού" }, { status: 500 });
    }

    return NextResponse.json({ material }, { status: 201 });
  } catch (e) {
    console.error("Materials error:", e);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const url = new URL(req.url);
  const assignmentId = url.searchParams.get("assignment_id");
  const workerId = authResult.session.worker_id;

  const query = supabase
    .from("worker_materials")
    .select("id, material_name, quantity, unit, notes, created_at, assignment_id")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });

  if (assignmentId) {
    query.eq("assignment_id", assignmentId);
  }

  const { data: materials } = await query;

  return NextResponse.json({ materials: materials || [] });
}
