import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// POST /api/photos/[id]/approve — manager approves or rejects a photo
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();
  if (!session.isManager) {
    return Response.json({ error: 'Μόνο διαχειριστές μπορούν να εγκρίνουν φωτογραφίες' }, { status: 403 });
  }

  const body = await req.json();
  const { approved, review_note } = body;

  const status = approved ? 'approved' : 'rejected';

  const { data, error } = await supabase
    .from('worker_photos')
    .update({
      status,
      reviewed_by: session.workerId,
      review_note: review_note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Σφάλμα ενημέρωσης φωτογραφίας' }, { status: 500 });
  }

  return Response.json({
    photo: data,
    message: approved ? 'Φωτογραφία εγκρίθηκε' : 'Φωτογραφία απορρίφθηκε',
  });
}
