import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/photos?assignment_id=xxx — get photos for an assignment
export async function GET(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignment_id');

  if (!assignmentId) {
    return Response.json({ error: 'Απαιτείται assignment_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('worker_photos')
    .select('id, photo_type, caption, status, s3_key, created_at')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: true });

  if (error) {
    return Response.json({ error: 'Σφάλμα φόρτωσης φωτογραφιών' }, { status: 500 });
  }

  return Response.json({ photos: data });
}
