import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// POST /api/checkin — record a GPS check-in event
export async function POST(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const body = await req.json();
  const { assignment_id, checkin_type, latitude, longitude, accuracy_meters, notes } = body;

  if (!assignment_id || !checkin_type || latitude == null || longitude == null) {
    return Response.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 });
  }

  const validTypes = ['start', 'end', 'break_start', 'break_end'];
  if (!validTypes.includes(checkin_type)) {
    return Response.json({ error: 'Μη έγκυρος τύπος check-in' }, { status: 400 });
  }

  // Verify the assignment belongs to this worker
  if (!session.isManager) {
    const { data: assignment } = await supabase
      .from('worker_assignments')
      .select('worker_id')
      .eq('id', assignment_id)
      .single();

    if (!assignment || assignment.worker_id !== session.workerId) {
      return Response.json({ error: 'Δεν έχετε πρόσβαση σε αυτή την ανάθεση' }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from('worker_checkins')
    .insert({
      assignment_id,
      worker_id: session.workerId,
      checkin_type,
      latitude,
      longitude,
      accuracy_meters,
      notes,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Σφάλμα καταγραφής check-in' }, { status: 500 });
  }

  const typeLabels: Record<string, string> = {
    start: 'Έναρξη εργασίας',
    end: 'Λήξη εργασίας',
    break_start: 'Έναρξη διαλείμματος',
    break_end: 'Τέλος διαλείμματος',
  };

  return Response.json({
    checkin: data,
    message: `${typeLabels[checkin_type]} καταγράφηκε επιτυχώς`,
  }, { status: 201 });
}

// GET /api/checkin?assignment_id=xxx — get check-ins for an assignment
export async function GET(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignment_id');

  if (!assignmentId) {
    return Response.json({ error: 'Απαιτείται assignment_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('worker_checkins')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: true });

  if (error) {
    return Response.json({ error: 'Σφάλμα φόρτωσης check-ins' }, { status: 500 });
  }

  return Response.json({ checkins: data });
}
