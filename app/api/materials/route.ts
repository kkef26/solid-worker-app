import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkerSession, unauthorizedResponse } from '@/lib/auth';

// POST /api/materials — log material usage
export async function POST(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const body = await req.json();
  const { assignment_id, material_name, quantity, unit, notes } = body;

  if (!assignment_id || !material_name || quantity == null || !unit) {
    return Response.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 });
  }

  if (quantity <= 0) {
    return Response.json({ error: 'Η ποσότητα πρέπει να είναι θετική' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('worker_materials')
    .insert({
      assignment_id,
      worker_id: session.workerId,
      material_name,
      quantity,
      unit,
      notes,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Σφάλμα καταγραφής υλικού' }, { status: 500 });
  }

  return Response.json({ material: data }, { status: 201 });
}

// GET /api/materials?assignment_id=xxx
export async function GET(req: NextRequest) {
  const session = await getWorkerSession(req);
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignment_id');

  if (!assignmentId) {
    return Response.json({ error: 'Απαιτείται assignment_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('worker_materials')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: true });

  if (error) {
    return Response.json({ error: 'Σφάλμα φόρτωσης υλικών' }, { status: 500 });
  }

  return Response.json({ materials: data });
}
