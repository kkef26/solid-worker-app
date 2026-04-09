import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/jobs — get today's assignments for the authenticated worker
export async function GET(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Managers can see all assignments; workers see only their own
  let query = supabase
    .from('worker_assignments')
    .select(`
      id, job_id, job_title, job_address, job_description,
      assigned_date, start_time, notes, created_at,
      worker_accounts!worker_assignments_worker_id_fkey(display_name, full_name),
      worker_checkins(id, checkin_type, created_at)
    `)
    .eq('assigned_date', date)
    .order('created_at', { ascending: true });

  if (!session.isManager) {
    query = query.eq('worker_id', session.workerId);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: 'Σφάλμα φόρτωσης εργασιών' }, { status: 500 });
  }

  return Response.json({ assignments: data });
}

// POST /api/jobs — manager creates new assignment
export async function POST(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();
  if (!session.isManager) {
    return Response.json({ error: 'Μόνο διαχειριστές μπορούν να αναθέτουν εργασίες' }, { status: 403 });
  }

  const body = await req.json();
  const { worker_id, job_id, job_title, job_address, job_description, assigned_date, start_time, notes } = body;

  if (!worker_id || !job_title || !job_address) {
    return Response.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('worker_assignments')
    .insert({
      worker_id,
      job_id: job_id || crypto.randomUUID(),
      job_title,
      job_address,
      job_description,
      assigned_date: assigned_date || new Date().toISOString().split('T')[0],
      start_time,
      notes,
      created_by: session.workerId,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Σφάλμα δημιουργίας ανάθεσης' }, { status: 500 });
  }

  return Response.json({ assignment: data }, { status: 201 });
}
