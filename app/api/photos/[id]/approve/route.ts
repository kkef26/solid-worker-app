import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// POST /api/photos/[id]/approve
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();
  if (!session.isManager) {
    return Response.json({ error: 'Μόνο διαχειριστές μπορούν να εγκρίνουν φωτογραφίες' }, { status: 403 });
  }

  const { approved, review_note } = await req.json();

  if (typeof approved !== 'boolean') {
    return Response.json({ error: 'Απαιτείται πεδίο approved (boolean)' }, { status: 400 });
  }

  const { data: photo, error: fetchError } = await supabase
    .from('worker_photos')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (fetchError || !photo) {
    return Response.json({ error: 'Η φωτογραφία δεν βρέθηκε' }, { status: 404 });
  }

  if (photo.status !== 'pending') {
    return Response.json({ error: 'Η φωτογραφία έχει ήδη επεξεργαστεί' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('worker_photos')
    .update({
      status: approved ? 'approved' : 'rejected',
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
    message: approved ? 'Η φωτογραφία εγκρίθηκε' : 'Η φωτογραφία απορρίφθηκε',
  });
}
