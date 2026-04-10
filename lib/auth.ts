import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

export const SESSION_COOKIE = 'solid_worker_session';

export interface WorkerSession {
  workerId: string;
  phoneNumber: string;
  displayName: string;
  isManager: boolean;
}

/**
 * Cookie-based session reader for Server Components / Route Handlers.
 * Reads the session cookie via next/headers, looks up the worker_sessions
 * table and returns the worker_accounts row (or null).
 */
export async function getSessionWorker() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data, error } = await supabase
    .from('worker_sessions')
    .select('worker_id, worker_accounts(id, phone_number, full_name, display_name, is_active, is_manager, role)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  const account = data.worker_accounts as {
    id: string;
    phone_number: string;
    full_name: string;
    display_name: string;
    is_active: boolean;
    is_manager: boolean;
    role: string;
  } | null;

  if (!account || !account.is_active) return null;

  return {
    id: account.id,
    workerId: data.worker_id,
    phone_number: account.phone_number,
    full_name: account.full_name,
    display_name: account.display_name,
    is_manager: account.is_manager,
    role: account.role,
  };
}

/**
 * Header-based session reader for API route handlers.
 * Supports Authorization: Bearer <token> and x-worker-token headers.
 */
export async function getWorkerSession(req: NextRequest): Promise<WorkerSession | null> {
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
