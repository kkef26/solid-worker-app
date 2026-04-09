'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkerStatus {
  id: string;
  display_name: string;
  full_name: string;
  phone_number: string;
  is_active: boolean;
  assignment?: {
    id: string;
    job_title: string;
    checked_in: boolean;
  };
}

interface PendingPhoto {
  id: string;
  assignment_id: string;
  photo_type: string;
  caption?: string;
  created_at: string;
  worker_name: string;
}

export default function ManagerOverviewPage() {
  const router = useRouter();
  const [workerName, setWorkerName] = useState('');
  const [assignments, setAssignments] = useState<{ id: string; job_title: string; job_address: string; worker_accounts: { display_name: string } | null; worker_checkins: { checkin_type: string }[] }[]>([]);
  const [pendingPhotoCount, setPendingPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('worker_token');
    const info = localStorage.getItem('worker_info');

    if (!token || !info) {
      router.push('/worker/login');
      return;
    }

    const w = JSON.parse(info);
    if (!w.is_manager) {
      router.push('/worker/dashboard');
      return;
    }
    setWorkerName(w.display_name);

    // Load today's assignments for all workers
    Promise.all([
      fetch('/api/jobs', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([jobsData]) => {
        setAssignments(jobsData.assignments || []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('worker_token');
    localStorage.removeItem('worker_info');
    router.push('/worker/login');
  };

  const today = new Date().toLocaleDateString('el-GR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const checkedInCount = assignments.filter((a) =>
    a.worker_checkins?.some((c) => c.checkin_type === 'start')
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F7' }}>
      <div className="header">
        <div>
          <h1>Επισκόπηση — {workerName}</h1>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{today}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 13 }}
        >
          Έξοδος
        </button>
      </div>

      <div className="page">
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0B2265' }}>{assignments.length}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Αναθέσεις</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#3FAE5A' }}>{checkedInCount}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Παρόντες</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>{pendingPhotoCount}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Εκκρεμή</div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/manager/assign" style={{ flex: 1 }}>
            <button className="btn-primary" style={{ fontSize: 14 }}>
              + Νέα Ανάθεση
            </button>
          </Link>
          <Link href="/manager/approvals" style={{ flex: 1 }}>
            <button className="btn-outline" style={{ fontSize: 14 }}>
              📷 Φωτ/ες
            </button>
          </Link>
        </div>

        {/* Today's assignments */}
        <h2 style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>ΣΗΜΕΡΙΝΕΣ ΑΝΑΘΕΣΕΙΣ</h2>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Φόρτωση...</div>
        ) : assignments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: '#64748b' }}>Δεν υπάρχουν αναθέσεις για σήμερα</p>
            <Link href="/manager/assign">
              <button className="btn-primary" style={{ marginTop: 16, fontSize: 14 }}>
                Ανάθεση Εργασίας
              </button>
            </Link>
          </div>
        ) : (
          assignments.map((a) => {
            const isActive = a.worker_checkins?.some((c) => c.checkin_type === 'start');
            const isDone = a.worker_checkins?.some((c) => c.checkin_type === 'end');
            return (
              <div key={a.id} className="card" style={{ borderLeft: `4px solid ${isDone ? '#3FAE5A' : isActive ? '#0B2265' : '#e2e8f0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 15, color: '#0B2265', marginBottom: 2 }}>{a.job_title}</h3>
                    <p style={{ fontSize: 13, color: '#64748b' }}>
                      👷 {a.worker_accounts?.display_name || '—'}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>{a.job_address}</p>
                  </div>
                  <span className={`tag ${isDone ? 'tag-approved' : isActive ? 'tag-pending' : ''}`}
                    style={!isDone && !isActive ? { background: '#f1f5f9', color: '#64748b' } : {}}>
                    {isDone ? 'Ολοκλ.' : isActive ? 'Ενεργή' : 'Αναμονή'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
