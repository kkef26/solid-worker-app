'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const UNITS = ['τεμ', 'kg', 'lt', 'm', 'm²', 'm³', 'σακί', 'κιβώτιο', 'πακέτο'];

function MaterialsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignment_id') || '';

  const [form, setForm] = useState({
    material_name: '',
    quantity: '',
    unit: 'τεμ',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId) {
      setError('Δεν βρέθηκε ανάθεση εργασίας');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('worker_token')}`,
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          material_name: form.material_name,
          quantity: parseFloat(form.quantity),
          unit: form.unit,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setForm({ material_name: '', quantity: '', unit: 'τεμ', notes: '' });

      setTimeout(() => {
        if (assignmentId) router.push(`/worker/job/${assignmentId}`);
        else router.push('/worker/dashboard');
      }, 1500);
    } catch {
      setError('Σφάλμα δικτύου');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F7' }}>
      <div className="header">
        <div>
          <Link href={assignmentId ? `/worker/job/${assignmentId}` : '/worker/dashboard'}
            style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            ← Πίσω
          </Link>
          <h1>Καταγραφή Υλικού</h1>
        </div>
      </div>

      <div className="page">
        {success ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <p style={{ fontWeight: 600, color: '#065f46' }}>Υλικό καταγράφηκε επιτυχώς!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="error-msg">{error}</div>}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                ΥΛΙΚΟ *
              </label>
              <input
                required
                value={form.material_name}
                onChange={(e) => setForm({ ...form, material_name: e.target.value })}
                placeholder="π.χ. Τσιμέντο Portland, Άμμος, Μπετόν..."
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                  ΠΟΣΟΤΗΤΑ *
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                  ΜΟΝΑΔΑ *
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15,
                    background: 'white',
                  }}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                ΣΗΜΕΙΩΣΕΙΣ
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Προαιρετικές σημειώσεις..."
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15,
                  resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>

            <button type="submit" className="btn-green" disabled={loading}>
              {loading ? 'Αποθήκευση...' : '✓ ΑΠΟΘΗΚΕΥΣΗ ΥΛΙΚΟΥ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, textAlign: 'center' }}>Φόρτωση...</div>}>
      <MaterialsForm />
    </Suspense>
  );
}
