'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface CheckIn {
  id: string;
  checkin_type: string;
  created_at: string;
  latitude: number;
  longitude: number;
}

interface Material {
  id: string;
  material_name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface Photo {
  id: string;
  s3_key: string;
  photo_type: string;
  caption?: string;
  status: string;
  created_at: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('worker_token') || '';

  useEffect(() => {
    if (!localStorage.getItem('worker_token')) {
      router.push('/worker/login');
      return;
    }
    loadData();
  }, [assignmentId]);

  const loadData = async () => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [checkinsRes, materialsRes, photosRes] = await Promise.all([
        fetch(`/api/checkin?assignment_id=${assignmentId}`, { headers }),
        fetch(`/api/materials?assignment_id=${assignmentId}`, { headers }),
        fetch(`/api/photos/upload?assignment_id=${assignmentId}`, { headers }),
      ]);

      if (checkinsRes.ok) setCheckins((await checkinsRes.json()).checkins || []);
      if (materialsRes.ok) setMaterials((await materialsRes.json()).materials || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (type: string) => {
    setCheckinLoading(true);
    setError('');
    setMessage('');

    if (!navigator.geolocation) {
      setError('Ο browser δεν υποστηρίζει GPS');
      setCheckinLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              assignment_id: assignmentId,
              checkin_type: type,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy_meters: pos.coords.accuracy,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setMessage(data.message);
            setCheckins((prev) => [...prev, data.checkin]);
          } else {
            setError(data.error);
          }
        } finally {
          setCheckinLoading(false);
        }
      },
      () => {
        setError('Αδυναμία λήψης GPS. Ελέγξτε τις άδειες τοποθεσίας.');
        setCheckinLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('Ανέβασμα φωτογραφίας...');

    try {
      // Get presigned URL
      const uploadRes = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          photo_type: 'during',
          filename: file.name,
          content_type: file.type,
        }),
      });

      if (!uploadRes.ok) {
        setError('Σφάλμα λήψης URL ανεβάσματος');
        return;
      }

      const { upload_url } = await uploadRes.json();

      // Upload to S3
      const s3Res = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (s3Res.ok) {
        setMessage('Φωτογραφία ανέβηκε επιτυχώς!');
      } else {
        setError('Σφάλμα ανεβάσματος φωτογραφίας');
      }
    } catch {
      setError('Σφάλμα δικτύου');
    }
  };

  const isStarted = checkins.some((c) => c.checkin_type === 'start');
  const isEnded = checkins.some((c) => c.checkin_type === 'end');

  const checkinTypeLabel: Record<string, string> = {
    start: '✅ Έναρξη',
    end: '🏁 Λήξη',
    break_start: '☕ Διάλειμμα',
    break_end: '🔄 Επιστροφή',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F7' }}>
      <div className="header">
        <div>
          <Link href="/worker/dashboard" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            ← Πίσω
          </Link>
          <h1>Εργασία</h1>
        </div>
      </div>

      <div className="page">
        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}

        {/* Check-in section */}
        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 12, color: '#0B2265' }}>ΠΑΡΟΥΣΙΑ & GPS</h2>

          {loading ? (
            <p style={{ color: '#64748b' }}>Φόρτωση...</p>
          ) : (
            <>
              {/* Check-in history */}
              {checkins.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {checkins.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <span>{checkinTypeLabel[c.checkin_type] || c.checkin_type}</span>
                      <span style={{ color: '#64748b' }}>
                        {new Date(c.created_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!isStarted && (
                  <button className="btn-green" onClick={() => handleCheckin('start')} disabled={checkinLoading}>
                    {checkinLoading ? '...' : '✋ ΠΑΡΟΥΣΙΑΣΗ (ΕΝΑΡΞΗ)'}
                  </button>
                )}
                {isStarted && !isEnded && (
                  <>
                    <button className="btn-outline" onClick={() => handleCheckin('break_start')} disabled={checkinLoading}
                      style={{ fontSize: 14 }}>
                      ☕ Έναρξη Διαλείμματος
                    </button>
                    <button className="btn-outline" onClick={() => handleCheckin('break_end')} disabled={checkinLoading}
                      style={{ fontSize: 14 }}>
                      🔄 Τέλος Διαλείμματος
                    </button>
                    <button className="btn-primary" onClick={() => handleCheckin('end')} disabled={checkinLoading}
                      style={{ background: '#dc2626' }}>
                      {checkinLoading ? '...' : '🏁 ΑΠΟΧΩΡΗΣΗ'}
                    </button>
                  </>
                )}
                {isEnded && (
                  <div style={{ textAlign: 'center', color: '#3FAE5A', fontWeight: 600 }}>
                    ✅ Η εργασία ολοκληρώθηκε
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Photo capture */}
        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 12, color: '#0B2265' }}>ΦΩΤΟΓΡΑΦΙΕΣ</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            style={{ display: 'none' }}
          />
          <button
            className="btn-outline"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 Λήψη Φωτογραφίας
          </button>
        </div>

        {/* Materials summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, color: '#0B2265' }}>ΥΛΙΚΑ</h2>
            <Link href="/worker/materials">
              <button style={{
                background: '#0B2265', color: 'white', padding: '6px 12px',
                borderRadius: 6, fontSize: 13, fontWeight: 600,
              }}>
                + Προσθήκη
              </button>
            </Link>
          </div>
          {materials.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 14 }}>Δεν έχουν καταγραφεί υλικά</p>
          ) : (
            materials.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span>{m.material_name}</span>
                <span style={{ color: '#64748b' }}>{m.quantity} {m.unit}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
