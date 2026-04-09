import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Service role client — bypasses RLS, server-side only
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

export type WorkerAccount = {
  id: string
  phone_number: string
  pin_hash: string
  full_name: string
  display_name: string
  is_active: boolean
  is_manager: boolean
  created_at: string
  last_login_at: string | null
}

export type WorkerSession = {
  id: string
  worker_id: string
  token: string
  expires_at: string
  device_info: Record<string, unknown> | null
  created_at: string
}

export type WorkerAssignment = {
  id: string
  worker_id: string
  job_id: string | null
  job_title: string
  job_address: string
  job_description: string | null
  assigned_date: string
  start_time: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type WorkerCheckin = {
  id: string
  assignment_id: string
  worker_id: string
  checkin_type: 'start' | 'end' | 'break_start' | 'break_end'
  latitude: number | null
  longitude: number | null
  accuracy_meters: number | null
  notes: string | null
  created_at: string
}

export type WorkerPhoto = {
  id: string
  assignment_id: string
  worker_id: string
  s3_key: string
  photo_type: 'before' | 'during' | 'after' | 'material' | 'issue'
  caption: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export type WorkerMaterial = {
  id: string
  assignment_id: string
  worker_id: string
  material_name: string
  quantity: number
  unit: string
  notes: string | null
  created_at: string
}
