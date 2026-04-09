'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Worker {
  id: string;
  display_name: string;
  full_name: string;
  is_active: boolean;
}

export default function AssignPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    worker_id: '',
    job_title: '',
    job_address: '',
    job_description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    start_time: '',
    notes: '',
  });

  const getToken = () => localStorage.getItem('worker_token') || '';

  useEffect(() => {
    const info = localStorage.getItem('worker_info');
    if (!info || !JSON.parse(info).is_manager) {
      router.push('/worker/login');
      return;
    }
    loadWorkers();
  }, [router]);

  const loadWorkers = async () => {
    setLoading(true);
    // Fetch active workers — using Supabase via a simple endpoint
    // For now we'll use the jobs endpoint to infer available workers
    // In production, add GET /api/workers endpoint
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.worker_id || !form.job_title || !form.job_address) {
      setError('Συμπληρώστε όλα τα υποχρεωτικά πεδία');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/manager/overview'), 1500);
    } catch {
      setError('Σφάλμα δικτύου');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F6F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ color: '#0B2265', fontFamily: 'Montserrat, sans-serif' }}>Η ανάθεση ολοκληρώθηκε!</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F7' }}>
      <div className="header">
        <div>
          <Link href="/manager/overview" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>← Πίσω</Link>
          <h1>Νέα Ανάθεση</h1>
        </div>
      </div>

      <div className="page">
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="error-msg">{error}</div>}

          {/* Worker selector */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              ΕΡΓΑΤΗΣ *
            </label>
            <input
              required
              value={form.worker_id}
              onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
              placeholder="UUID εργάτη..."
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14,
              }}
            />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Εισάγετε το ID εργάτη από το Supabase dashboard
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              ΤΙΤΛΟΣ ΕΡΓΑΣΙΑΣ *
            </label>
            <input
              required
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              placeholder="π.χ. Επισκευή οροφής — Κολωνάκι"
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              ΔΙΕΥΘΥΝΣΗ *
            </label>
            <input
              required
              value={form.job_address}
              onChange={(e) => setForm({ ...form, job_address: e.target.value })}
              placeholder="π.χ. Σκουφά 12, Κολωνάκι, Αθήνα"
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              ΠΕΡΙΓΡΑΦΗ
            </label>
            <textarea
              value={form.job_description}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
              placeholder="Λεπτομέρειες εργασίας..."
              rows={3}
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                ΗΜΕΡΟΜΗΝΙΑ
              </label>
              <input
                type="date"
                value={form.assigned_date}
                onChange={(e) => setForm({ ...form, assigned_date: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                ΩΡΑ ΕΝΑΡΞΗΣ
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              ΣΗΜΕΙΩΣΕΙΣ
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ιδιαίτερες οδηγίες..."
              rows={2}
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitLoading}>
            {submitLoading ? 'Αποθήκευση...' : '✓ ΑΝΑΘΕΣΗ ΕΡΓΑΣΙΑΣ'}
          </button>
        </form>
      </div>
    </div>
  );
}
