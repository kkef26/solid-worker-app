import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireManager } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET /api/jobs — worker's today assignments
// GET /api/jobs?id=xxx — single assignment detail
// GET /api/jobs?overview=true — manager: all workers + stats
// GET /api/jobs?workers=true — manager: worker list for assignment form
// POST /api/jobs — manager: create assignment
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const overview = url.searchParams.get("overview");
  const workersOnly = url.searchParams.get("workers");

  if (overview || workersOnly) {
    const authResult = await requireManager(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (workersOnly) {
      const { data: workers } = await supabase
        .from("worker_accounts")
        .select("id, full_name, display_name, phone_number, is_active")
        .eq("is_active", true)
        .eq("is_manager", false)
        .order("full_name");
      return NextResponse.json({ workers: workers || [] });
    }

    // Manager overview
    const today = new Date().toISOString().split("T")[0];
    const managerWorker = authResult.session.worker_accounts as unknown as Record<string, unknown>;

    const { data: workers } = await supabase
      .from("worker_accounts")
      .select("id, full_name, display_name, phone_number, is_active, is_manager")
      .eq("is_active", true)
      .eq("is_manager", false);

    // Get today's assignments
    const { data: assignments } = await supabase
      .from("worker_assignments")
      .select("id, worker_id")
      .eq("assigned_date", today);

    // Get today's checkins (start type)
    const { data: checkins } = await supabase
      .from("worker_checkins")
      .select("worker_id, checkin_type, created_at")
      .eq("checkin_type", "start")
      .gte("created_at", today + "T00:00:00");

    // Get pending photos
    const { data: pendingPhotos } = await supabase
      .from("worker_photos")
      .select("worker_id")
      .eq("status", "pending");

    const checkedInWorkerIds = new Set((checkins || []).map((c) => c.worker_id));
    const assignedWorkerIds = new Set((assignments || []).map((a) => a.worker_id));

    const workerStatuses = (workers || []).map((w) => {
      const pending = (pendingPhotos || []).filter((p) => p.worker_id === w.id).length;
      return {
        ...w,
        today_assignments: (assignments || []).filter((a) => a.worker_id === w.id).length,
        checked_in: checkedInWorkerIds.has(w.id),
        pending_photos: pending,
      };
    });

    const stats = {
      total_workers: (workers || []).length,
      checked_in_today: checkedInWorkerIds.size,
      pending_photos: (pendingPhotos || []).length,
      today_assignments: (assignments || []).length,
    };

    return NextResponse.json({
      workers: workerStatuses,
      stats,
      manager_name: (managerWorker?.display_name as string) || "",
    });
  }

  const authResult = await requireAuth(req);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const worker = authResult.session.worker_accounts as unknown as Record<string, unknown>;
  const workerId = authResult.session.worker_id;

  if (id) {
    // Single assignment detail
    const { data: assignment } = await supabase
      .from("worker_assignments")
      .select(`
        id, job_title, job_address, job_description, assigned_date, start_time, notes,
        worker_checkins(id, checkin_type, created_at, latitude, longitude),
        worker_photos(id, s3_key, photo_type, caption, status, created_at)
      `)
      .eq("id", id)
      .eq("worker_id", workerId)
      .single();

    return NextResponse.json({ assignment });
  }

  // Today's assignments for this worker
  const today = new Date().toISOString().split("T")[0];
  const { data: assignments } = await supabase
    .from("worker_assignments")
    .select("id, job_title, job_address, job_description, assigned_date, start_time, notes")
    .eq("worker_id", workerId)
    .eq("assigned_date", today)
    .order("start_time", { ascending: true, nullsFirst: false });

  return NextResponse.json({
    assignments: assignments || [],
    worker_name: (worker?.display_name as string) || (worker?.full_name as string) || "",
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireManager(req);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await req.json();
    const { worker_id, job_title, job_address, job_description, assigned_date, start_time, notes } = body;

    if (!worker_id || !job_title || !job_address) {
      return NextResponse.json({ error: "Απαιτούνται εργαζόμενος, τίτλος και διεύθυνση" }, { status: 400 });
    }

    const managerId = authResult.session.worker_id;

    const { data, error } = await supabase
      .from("worker_assignments")
      .insert({
        worker_id,
        job_title,
        job_address,
        job_description: job_description || null,
        assigned_date: assigned_date || new Date().toISOString().split("T")[0],
        start_time: start_time || null,
        notes: notes || null,
        created_by: managerId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Σφάλμα δημιουργίας ανάθεσης" }, { status: 500 });
    }

    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (e) {
    console.error("Create assignment error:", e);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα" }, { status: 500 });
  }
}
