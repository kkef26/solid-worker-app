'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<'phone' | 'pin'>('phone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNumpad(key: string) {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1))
      return
    }
    if (key === '') return
    if (pin.length >= 4) return
    const next = pin + key
    setPin(next)
    if (next.length === 4) {
      handleLogin(next)
    }
  }

  async function handleLogin(pinValue: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, pin: pinValue }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Σφάλμα σύνδεσης')
        setPin('')
        return
      }
      if (data.is_manager) {
        router.push('/manager/overview')
      } else {
        router.push('/worker/dashboard')
      }
    } catch {
      setError('Σφάλμα δικτύου. Δοκιμάστε ξανά.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-solid-blue flex flex-col items-center justify-center px-6">
      {/* Logo / Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-solid-green mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 28V12L16 4L28 12V28H20V20H12V28H4Z" fill="white" />
          </svg>
        </div>
        <h1 className="text-white text-2xl font-heading font-800">Solid Workers</h1>
        <p className="text-white/60 text-sm mt-1">Anadomisi Tech</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
        {step === 'phone' ? (
          <>
            <h2 className="text-solid-blue font-heading font-700 text-xl mb-1">Είσοδος</h2>
            <p className="text-gray-500 text-sm mb-6">Εισάγετε τον αριθμό σας</p>
            <input
              type="tel"
              className="input-field mb-6 text-center text-xl tracking-widest"
              placeholder="+30 690 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <button
              className="btn-primary"
              onClick={() => {
                if (!phone.trim()) { setError('Εισάγετε αριθμό τηλεφώνου'); return }
                setError('')
                setStep('pin')
              }}
            >
              Συνέχεια
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center mb-6">
              <button
                className="mr-3 text-gray-400 hover:text-gray-600"
                onClick={() => { setStep('phone'); setPin(''); setError('') }}
              >
                ←
              </button>
              <div>
                <h2 className="text-solid-blue font-heading font-700 text-xl">PIN</h2>
                <p className="text-gray-500 text-sm">{phone}</p>
              </div>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-4 mb-8">
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    i < pin.length
                      ? 'bg-solid-green border-solid-green scale-110'
                      : 'border-gray-300'
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {NUMPAD.map((key, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNumpad(key)}
                  disabled={loading || key === ''}
                  className={`
                    h-16 rounded-2xl text-xl font-heading font-600 transition-all active:scale-95
                    ${key === '' ? 'invisible' : ''}
                    ${key === '⌫'
                      ? 'bg-gray-100 text-gray-600 active:bg-gray-200'
                      : 'bg-solid-concrete text-solid-blue active:bg-solid-green active:text-white'
                    }
                    ${loading ? 'opacity-50' : ''}
                  `}
                >
                  {loading && pin.length === 4 ? (
                    <span className="inline-block w-5 h-5 border-2 border-solid-blue border-t-transparent rounded-full animate-spin" />
                  ) : key}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-white/30 text-xs mt-8">Solid Anadomisi Tech © 2026</p>
    </div>
  )
}
