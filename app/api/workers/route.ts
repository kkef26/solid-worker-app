import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// GET /api/workers — manager only: list all active workers
export async function GET(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  if (!session.isManager) {
    return Response.json({ error: 'Μόνο διαχειριστές' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('worker_accounts')
    .select('id, display_name, full_name, phone_number, is_active, is_manager, last_login_at')
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    return Response.json({ error: 'Σφάλμα φόρτωσης εργατών' }, { status: 500 });
  }

  return Response.json({ workers: data });
}
