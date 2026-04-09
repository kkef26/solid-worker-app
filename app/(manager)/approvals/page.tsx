'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PendingPhoto {
  id: string;
  assignment_id: string;
  s3_key: string;
  photo_type: string;
  caption?: string;
  status: string;
  created_at: string;
  worker_accounts?: { display_name: string };
  worker_assignments?: { job_title: string };
}

const photoTypeLabel: Record<string, string> = {
  before: 'Πριν',
  during: 'Κατά τη διάρκεια',
  after: 'Μετά',
  material: 'Υλικό',
  issue: 'Πρόβλημα',
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const getToken = () => localStorage.getItem('worker_token') || '';

  useEffect(() => {
    const info = localStorage.getItem('worker_info');
    if (!info || !JSON.parse(info).is_manager) {
      router.push('/worker/login');
      return;
    }
    loadPhotos();
  }, [router]);

  const loadPhotos = async () => {
    // Fetch pending photos via Supabase direct or via a dedicated endpoint
    // Using the assignments endpoint to get all, then filter photos
    // For now, fetch all pending photos via a simple query endpoint
    try {
      // We'll use the jobs endpoint and get photos from each assignment
      // In production, add GET /api/photos?status=pending
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (photoId: string, status: 'approved' | 'rejected') => {
    setActionLoading(photoId);
    try {
      const res = await fetch(`/api/photos/${photoId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          status,
          review_note: reviewNotes[photoId] || '',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F7' }}>
      <div className="header">
        <div>
          <Link href="/manager/overview" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>← Πίσω</Link>
          <h1>Έγκριση Φωτογραφιών</h1>
        </div>
      </div>

      <div className="page">
        {message && <div className="success-msg">{message}</div>}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Φόρτωση...</div>
        ) : photos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <h3 style={{ color: '#0B2265', marginBottom: 8 }}>Δεν υπάρχουν εκκρεμείς φωτογραφίες</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>Όλες οι φωτογραφίες έχουν αξιολογηθεί</p>
          </div>
        ) : (
          photos.map((photo) => (
            <div key={photo.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span className="tag tag-pending" style={{ marginRight: 8 }}>
                    {photoTypeLabel[photo.photo_type] || photo.photo_type}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>
                    {photo.worker_accounts?.display_name}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {new Date(photo.created_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {photo.caption && (
                <p style={{ fontSize: 13, color: '#2B2B2B', marginBottom: 12 }}>{photo.caption}</p>
              )}

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: '#64748b' }}>
                📁 {photo.s3_key.split('/').pop()}
              </div>

              <textarea
                placeholder="Σημείωση (προαιρετική)..."
                value={reviewNotes[photo.id] || ''}
                onChange={(e) => setReviewNotes((prev) => ({ ...prev, [photo.id]: e.target.value }))}
                rows={2}
                style={{
                  width: '100%', padding: '10px 12px', marginBottom: 12,
                  border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                  resize: 'none', fontFamily: 'inherit',
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleReview(photo.id, 'approved')}
                  disabled={actionLoading === photo.id}
                  style={{
                    flex: 1, background: '#3FAE5A', color: 'white',
                    padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  }}
                >
                  ✓ Έγκριση
                </button>
                <button
                  onClick={() => handleReview(photo.id, 'rejected')}
                  disabled={actionLoading === photo.id}
                  style={{
                    flex: 1, background: '#fee2e2', color: '#dc2626',
                    padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: 'none',
                  }}
                >
                  ✗ Απόρριψη
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
