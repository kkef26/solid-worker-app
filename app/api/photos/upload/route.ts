import { NextResponse } from 'next/server'
import { validateToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getPresignedUploadUrl, buildS3Key } from '@/lib/s3'
import { SESSION_COOKIE } from '@/lib/auth'

async function getWorker(request: Request) {
  const token = request.headers.get('cookie')
    ?.split(';')
    .find(c => c.trim().startsWith(SESSION_COOKIE + '='))
    ?.split('=')[1]
  if (!token) return null
  return validateToken(token)
}

export async function POST(request: Request) {
  const worker = await getWorker(request)
  if (!worker) return NextResponse.json({ error: 'Μη εξουσιοδοτημένος' }, { status: 401 })

  try {
    const { assignment_id, filename, content_type, photo_type, caption } = await request.json()

    if (!assignment_id || !filename || !content_type || !photo_type) {
      return NextResponse.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 })
    }

    // Verify assignment
    const { data: assignment } = await supabase
      .from('worker_assignments')
      .select('id')
      .eq('id', assignment_id)
      .eq('worker_id', worker.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Η εργασία δεν βρέθηκε' }, { status: 404 })
    }

    const s3Key = buildS3Key(assignment_id, filename)
    const upload_url = await getPresignedUploadUrl(s3Key, content_type)

    // Create photo record
    const { data: photo, error } = await supabase
      .from('worker_photos')
      .insert({
        assignment_id,
        worker_id: worker.id,
        s3_key: `photos/${s3Key}`,
        photo_type,
        caption: caption ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      upload_url,
      s3_key: `photos/${s3Key}`,
      photo_id: photo.id,
    })
  } catch (err) {
    console.error('Photo upload error:', err)
    return NextResponse.json({ error: 'Σφάλμα διακομιστή' }, { status: 500 })
  }
}
