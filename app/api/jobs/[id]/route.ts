import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/jobs/[id] — get single assignment detail
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const { data, error } = await supabase
    .from('worker_assignments')
    .select(`
      id, job_id, job_title, job_address, job_description,
      assigned_date, start_time, notes, created_at,
      worker_accounts!worker_assignments_worker_id_fkey(display_name, full_name)
    `)
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Η εργασία δεν βρέθηκε' }, { status: 404 });
  }

  // Workers can only view their own assignments
  if (!session.isManager) {
    const { data: assignment } = await supabase
      .from('worker_assignments')
      .select('worker_id')
      .eq('id', params.id)
      .single();
    if (!assignment || assignment.worker_id !== session.workerId) {
      return Response.json({ error: 'Δεν έχετε πρόσβαση' }, { status: 403 });
    }
  }

  return Response.json({ assignment: data });
}
