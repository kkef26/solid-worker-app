import { supabase } from "./supabase";
import { NextRequest } from "next/server";

export async function getWorkerFromToken(req: NextRequest) {
  const token = req.headers.get("x-worker-token") || req.cookies.get("worker_token")?.value;
  if (!token) return null;

  const { data: session } = await supabase
    .from("worker_sessions")
    .select("worker_id, expires_at, worker_accounts(*)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!session) return null;
  return session;
}

export async function requireAuth(req: NextRequest) {
  const session = await getWorkerFromToken(req);
  if (!session) {
    return { error: "Μη εξουσιοδοτημένη πρόσβαση", status: 401 };
  }
  return { session };
}

export async function requireManager(req: NextRequest) {
  const result = await requireAuth(req);
  if ("error" in result) return result;

  const worker = result.session.worker_accounts as unknown as Record<string, unknown>;
  if (!worker?.is_manager) {
    return { error: "Μόνο για διαχειριστές", status: 403 };
  }
  return result;
}
