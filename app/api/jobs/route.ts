import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/jobs
export async function GET(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);

  // Manager overview mode
  if (searchParams.get('overview') === 'true') {
    if (!session.isManager) {
      return Response.json({ error: 'Μόνο διαχειριστές' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: workers } = await supabase
      .from('worker_accounts')
      .select(`
        id, display_name, full_name, phone_number,
        worker_assignments!worker_assignments_worker_id_fkey(id, assigned_date,
          worker_checkins(id, checkin_type)
        ),
        worker_photos!worker_photos_worker_id_fkey(id, status)
      `)
      .eq('is_active', true)
      .order('full_name');

    const processedWorkers = (workers || []).map((w: any) => {
      const todayAssignments = (w.worker_assignments || []).filter((a: any) => a.assigned_date === today);
      const checkedIn = todayAssignments.some((a: any) =>
        (a.worker_checkins || []).some((c: any) => c.checkin_type === 'start')
      );
      const pendingPhotos = (w.worker_photos || []).filter((p: any) => p.status === 'pending').length;
      return {
        id: w.id,
        full_name: w.full_name,
        display_name: w.display_name,
        phone_number: w.phone_number,
        is_active: true,
        today_assignments: todayAssignments.length,
        checked_in: checkedIn,
        pending_photos: pendingPhotos,
      };
    });

    const { count: pendingPhotosTotal } = await supabase
      .from('worker_photos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const stats = {
      total_workers: processedWorkers.length,
      checked_in_today: processedWorkers.filter((w: any) => w.checked_in).length,
      pending_photos: pendingPhotosTotal || 0,
      today_assignments: processedWorkers.reduce((sum: number, w: any) => sum + w.today_assignments, 0),
    };

    return Response.json({
      workers: processedWorkers,
      stats,
      manager_name: session.displayName,
    });
  }

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

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

  return Response.json({ assignments: data, worker_name: session.displayName });
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
