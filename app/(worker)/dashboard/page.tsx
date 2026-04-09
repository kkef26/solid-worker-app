'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Assignment {
  id: string;
  job_title: string;
  job_address: string;
  job_description?: string;
  assigned_date: string;
  start_time?: string;
  notes?: string;
  worker_checkins: { id: string; checkin_type: string }[];
}

interface WorkerInfo {
  id: string;
  display_name: string;
  is_manager: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('worker_token');
    const info = localStorage.getItem('worker_info');
    if (!token || !info) {
      router.push('/worker/login');
      return;
    }
    const w = JSON.parse(info) as WorkerInfo;
    setWorker(w);

    if (w.is_manager) {
      router.push('/manager/overview');
      return;
    }

    fetch('/api/jobs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setAssignments(d.assignments || []))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('worker_token');
    localStorage.removeItem('worker_info');
    router.push('/worker/login');
  };

  const isCheckedIn = (a: Assignment) =>
    a.worker_checkins.some((c) => c.checkin_type === 'start');

  const today = new Date().toLocaleDateString('el-GR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F7' }}>
      {/* Header */}
      <div className="header">
        <div>
          <h1>Καλημέρα, {worker?.display_name}! 👷</h1>
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
        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0B2265' }}>{assignments.length}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Εργασίες σήμερα</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#3FAE5A' }}>
              {assignments.filter(isCheckedIn).length}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Παρουσίες</div>
          </div>
        </div>

        {/* Assignments */}
        <h2 style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>ΣΗΜΕΡΙΝΕΣ ΕΡΓΑΣΙΕΣ</h2>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>
            Φόρτωση...
          </div>
        ) : assignments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ color: '#64748b' }}>Δεν υπάρχουν ανατεθειμένες εργασίες για σήμερα</p>
          </div>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="card" style={{ borderLeft: `4px solid ${isCheckedIn(a) ? '#3FAE5A' : '#0B2265'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, color: '#0B2265', marginBottom: 4 }}>{a.job_title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>📍 {a.job_address}</p>
                  {a.start_time && (
                    <p style={{ fontSize: 13, color: '#64748b' }}>🕐 {a.start_time}</p>
                  )}
                </div>
                {isCheckedIn(a) && (
                  <span className="tag tag-approved">✓ Παρών</span>
                )}
              </div>

              {a.job_description && (
                <p style={{ fontSize: 13, color: '#2B2B2B', marginBottom: 12, lineHeight: 1.5 }}>
                  {a.job_description}
                </p>
              )}

              <Link href={`/worker/job/${a.id}`}>
                <button
                  className={isCheckedIn(a) ? 'btn-outline' : 'btn-primary'}
                  style={{ fontSize: 14, padding: '10px 16px' }}
                >
                  {isCheckedIn(a) ? 'ΠΡΟΒΟΛΗ ΕΡΓΑΣΙΑΣ' : '✋ ΠΑΡΟΥΣΙΑΣΗ'}
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
