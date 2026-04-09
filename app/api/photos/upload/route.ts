import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireManager } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET || "anadomisi-documents";

// GET /api/photos/upload?pending=true — manager: list pending photos for approval
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pending = url.searchParams.get("pending");

  if (pending) {
    const authResult = await requireManager(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { data: photos } = await supabase
      .from("worker_photos")
      .select(`
        id, s3_key, photo_type, caption, created_at, assignment_id, worker_id,
        worker_assignments(job_title, job_address),
        worker_accounts(display_name, full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    return NextResponse.json({ photos: photos || [] });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}

// POST /api/photos/upload — worker: get presigned S3 URL
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await req.json();
    const { assignment_id, photo_type, caption, filename, content_type } = body;

    if (!assignment_id || !photo_type || !filename || !content_type) {
      return NextResponse.json({ error: "Λείπουν απαιτούμενα πεδία" }, { status: 400 });
    }

    const validTypes = ["before", "during", "after", "material", "issue"];
    if (!validTypes.includes(photo_type)) {
      return NextResponse.json({ error: "Μη έγκυρος τύπος φωτογραφίας" }, { status: 400 });
    }

    const workerId = authResult.session.worker_id;

    // Verify assignment
    const { data: assignment } = await supabase
      .from("worker_assignments")
      .select("id")
      .eq("id", assignment_id)
      .eq("worker_id", workerId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Η ανάθεση δεν βρέθηκε" }, { status: 404 });
    }

    // Generate S3 key
    const ext = filename.split(".").pop() || "jpg";
    const s3_key = `photos/${assignment_id}/${Date.now()}_${workerId.slice(0, 8)}.${ext}`;

    // Create presigned PUT URL (300s expiry)
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3_key,
      ContentType: content_type,
    });
    const upload_url = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Pre-create photo record (status will be pending)
    await supabase.from("worker_photos").insert({
      assignment_id,
      worker_id: workerId,
      s3_key,
      photo_type,
      caption: caption || null,
      status: "pending",
    });

    return NextResponse.json({ upload_url, s3_key });
  } catch (e) {
    console.error("Photo upload error:", e);
    return NextResponse.json({ error: "Εσωτερικό σφάλμα" }, { status: 500 });
  }
}

// PATCH /api/photos/upload — confirm upload completed (no-op, already inserted)
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  return NextResponse.json({ ok: true });
}
