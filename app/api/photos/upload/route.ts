import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';
import { getPresignedUploadUrl, buildS3Key } from '@/lib/s3';

// GET /api/photos/upload?pending=true — manager: list pending photos for review
export async function GET(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();
  if (!session.isManager) return Response.json({ error: 'Μόνο διαχειριστές' }, { status: 403 });

  const { data, error } = await supabase
    .from('worker_photos')
    .select(`
      id, s3_key, photo_type, caption, status, created_at, assignment_id,
      worker_assignments!worker_photos_assignment_id_fkey(job_title, job_address),
      worker_accounts!worker_photos_worker_id_fkey(display_name, full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    return Response.json({ error: 'Σφάλμα φόρτωσης φωτογραφιών' }, { status: 500 });
  }

  return Response.json({ photos: data });
}

// POST /api/photos/upload — get presigned S3 URL + register photo record
export async function POST(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const body = await req.json();
  const { assignment_id, photo_type, caption, filename, content_type } = body;

  if (!assignment_id || !photo_type || !filename || !content_type) {
    return Response.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 });
  }

  const validTypes = ['before', 'during', 'after', 'material', 'issue'];
  if (!validTypes.includes(photo_type)) {
    return Response.json({ error: 'Μη έγκυρος τύπος φωτογραφίας' }, { status: 400 });
  }

  const s3Key = buildS3Key(assignment_id, session.workerId, filename);

  let uploadUrl: string;
  try {
    uploadUrl = await getPresignedUploadUrl(s3Key, content_type);
  } catch {
    return Response.json({ error: 'Σφάλμα δημιουργίας URL ανεβάσματος' }, { status: 500 });
  }

  const { data: photo, error } = await supabase
    .from('worker_photos')
    .insert({
      assignment_id,
      worker_id: session.workerId,
      s3_key: s3Key,
      photo_type,
      caption,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Σφάλμα εγγραφής φωτογραφίας' }, { status: 500 });
  }

  return Response.json({
    photo_id: photo.id,
    upload_url: uploadUrl,
    s3_key: s3Key,
    expires_in: 300,
  }, { status: 201 });
}
