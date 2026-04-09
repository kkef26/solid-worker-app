'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PIN_DIGITS = 4;

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinKey = (digit: string) => {
    if (pin.length < PIN_DIGITS) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleLogin = async () => {
    if (!phone || pin.length < PIN_DIGITS) {
      setError('Εισάγετε αριθμό τηλεφώνου και 4-ψήφιο PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Σφάλμα σύνδεσης');
        setPin('');
        return;
      }

      // Store session
      localStorage.setItem('worker_token', data.token);
      localStorage.setItem('worker_info', JSON.stringify(data.worker));

      if (data.worker.is_manager) {
        router.push('/manager/overview');
      } else {
        router.push('/worker/dashboard');
      }
    } catch {
      setError('Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας.');
    } finally {
      setLoading(false);
    }
  };

  const numpadKeys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B2265',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo area */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: 64,
          height: 64,
          background: '#3FAE5A',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 28,
        }}>
          🏗️
        </div>
        <h1 style={{ color: 'white', fontSize: 24, fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>
          Solid Workers
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
          Solid Anadomisi
        </p>
      </div>

      {/* Login card */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '24px',
        width: '100%',
        maxWidth: 360,
      }}>
        {error && (
          <div className="error-msg" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Phone input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
            ΑΡΙΘΜΟΣ ΤΗΛΕΦΩΝΟΥ
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+30 690 000 0001"
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 16,
              letterSpacing: 1,
            }}
          />
        </div>

        {/* PIN display */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
            PIN
          </label>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {Array.from({ length: PIN_DIGITS }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 52,
                  height: 52,
                  border: `2px solid ${pin.length > i ? '#0B2265' : '#e2e8f0'}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  background: pin.length > i ? '#f0f4ff' : 'white',
                  transition: 'all 0.15s',
                }}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Numpad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 20,
        }}>
          {numpadKeys.map((key, i) => (
            <button
              key={i}
              onClick={() => {
                if (key === '⌫') handleBackspace();
                else if (key !== '') handlePinKey(key);
              }}
              disabled={key === ''}
              style={{
                padding: '16px',
                background: key === '⌫' ? '#fee2e2' : key === '' ? 'transparent' : '#f8fafc',
                border: key === '' ? 'none' : '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: key === '⌫' ? 18 : 20,
                fontWeight: 600,
                color: key === '⌫' ? '#dc2626' : '#0B2265',
                cursor: key === '' ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Login button */}
        <button
          className="btn-primary"
          onClick={handleLogin}
          disabled={loading || !phone || pin.length < PIN_DIGITS}
        >
          {loading ? 'Σύνδεση...' : 'ΣΥΝΔΕΣΗ'}
        </button>
      </div>
    </div>
  );
}
