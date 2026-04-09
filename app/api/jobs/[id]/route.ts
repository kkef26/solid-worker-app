import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/jobs/[id] — get a single assignment with its details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const { data, error } = await supabase
    .from('worker_assignments')
    .select('id, job_id, job_title, job_address, job_description, assigned_date, start_time, notes, created_at')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Η ανάθεση δεν βρέθηκε' }, { status: 404 });
  }

  // Workers can only view their own assignments; managers can view all
  if (!session.isManager) {
    const { data: ownerCheck } = await supabase
      .from('worker_assignments')
      .select('worker_id')
      .eq('id', params.id)
      .single();

    if (!ownerCheck || ownerCheck.worker_id !== session.workerId) {
      return Response.json({ error: 'Δεν έχετε πρόσβαση σε αυτή την ανάθεση' }, { status: 403 });
    }
  }

  return Response.json({ assignment: data });
}
