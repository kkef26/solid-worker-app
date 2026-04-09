import { NextRequest } from 'next/server';
import { supabase } from './supabase';

export interface WorkerSession {
  workerId: string;
  phoneNumber: string;
  displayName: string;
  isManager: boolean;
}

export async function getWorkerSession(req: NextRequest): Promise<WorkerSession | null> {
  // Support both Authorization: Bearer and x-worker-token headers
  let token: string | null = null;

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = req.headers.get('x-worker-token');
  }

  if (!token) return null;

  const { data, error } = await supabase
    .from('worker_sessions')
    .select('worker_id, worker_accounts(phone_number, display_name, is_manager, is_active)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  const account = data.worker_accounts as {
    phone_number: string;
    display_name: string;
    is_manager: boolean;
    is_active: boolean;
  } | null;

  if (!account || !account.is_active) return null;

  return {
    workerId: data.worker_id,
    phoneNumber: account.phone_number,
    displayName: account.display_name,
    isManager: account.is_manager,
  };
}

export function unauthorizedResponse(message = 'Μη εξουσιοδοτημένη πρόσβαση') {
  return Response.json({ error: message }, { status: 401 });
}
