'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  assignmentId: string
  hasStarted: boolean
  hasEnded: boolean
  onBreak: boolean
}

const PHOTO_TYPES = [
  { value: 'before', label: 'Πριν' },
  { value: 'during', label: 'Κατά τη διάρκεια' },
  { value: 'after', label: 'Μετά' },
  { value: 'material', label: 'Υλικό' },
  { value: 'issue', label: 'Πρόβλημα' },
]

const MATERIAL_UNITS = ['τεμ.', 'μ', 'μ²', 'μ³', 'kg', 'lt', 'σακί', 'κιβ.']

export default function JobActions({ assignmentId, hasStarted, hasEnded, onBreak }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showPhotoForm, setShowPhotoForm] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [photoType, setPhotoType] = useState('before')
  const [photoCaption, setPhotoCaption] = useState('')
  const [materialName, setMaterialName] = useState('')
  const [materialQty, setMaterialQty] = useState('')
  const [materialUnit, setMaterialUnit] = useState('τεμ.')
  const [materialNotes, setMaterialNotes] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function checkin(type: string) {
    setLoading(type)
    setError('')
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignment_id: assignmentId,
              checkin_type: type,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy_meters: pos.coords.accuracy,
            }),
          })
          if (!res.ok) {
            const d = await res.json()
            setError(d.error ?? 'Σφάλμα καταγραφής')
          } else {
            router.refresh()
          }
          setLoading(null)
        },
        async () => {
          // GPS unavailable — checkin without coords
          const res = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignment_id: assignmentId, checkin_type: type }),
          })
          if (!res.ok) {
            const d = await res.json()
            setError(d.error ?? 'Σφάλμα καταγραφής')
          } else {
            router.refresh()
          }
          setLoading(null)
        },
        { timeout: 10000 }
      )
    } catch {
      setError('Σφάλμα. Δοκιμάστε ξανά.')
      setLoading(null)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading('photo')
    setError('')
    try {
      // Get presigned URL
      const urlRes = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          filename: file.name,
          content_type: file.type,
          photo_type: photoType,
          caption: photoCaption,
        }),
      })
      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { upload_url, s3_key, photo_id } = await urlRes.json()

      // Upload to S3
      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      setShowPhotoForm(false)
      setPhotoCaption('')
      router.refresh()
    } catch {
      setError('Σφάλμα ανεβάσματος φωτογραφίας')
    } finally {
      setLoading(null)
    }
  }

  async function handleMaterialSubmit() {
    if (!materialName || !materialQty) {
      setError('Συμπληρώστε όνομα και ποσότητα')
      return
    }
    setLoading('material')
    setError('')
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          material_name: materialName,
          quantity: parseFloat(materialQty),
          unit: materialUnit,
          notes: materialNotes,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Σφάλμα αποθήκευσης')
      } else {
        setShowMaterialForm(false)
        setMaterialName('')
        setMaterialQty('')
        setMaterialNotes('')
        router.refresh()
      }
    } catch {
      setError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setLoading(null)
    }
  }

  if (hasEnded) {
    return (
      <div className="card text-center bg-gray-50">
        <p className="text-gray-500 font-heading font-600">✅ Η εργασία ολοκληρώθηκε</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Primary check-in button */}
      {!hasStarted ? (
        <button
          onClick={() => checkin('start')}
          disabled={!!loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading === 'start' ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '📍'}
          ΠΑΡΟΥΣΙΑΣΗ — Έναρξη
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {!onBreak ? (
            <button
              onClick={() => checkin('break_start')}
              disabled={!!loading}
              className="bg-yellow-400 text-yellow-900 font-heading font-700 py-4 rounded-xl active:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              {loading === 'break_start' ? (
                <span className="w-4 h-4 border-2 border-yellow-900 border-t-transparent rounded-full animate-spin" />
              ) : '⏸️'}
              Διάλειμμα
            </button>
          ) : (
            <button
              onClick={() => checkin('break_end')}
              disabled={!!loading}
              className="bg-blue-500 text-white font-heading font-700 py-4 rounded-xl active:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              {loading === 'break_end' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : '▶️'}
              Συνέχεια
            </button>
          )}
          <button
            onClick={() => checkin('end')}
            disabled={!!loading}
            className="bg-red-500 text-white font-heading font-700 py-4 rounded-xl active:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'end' ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : '🔴'}
            Λήξη
          </button>
        </div>
      )}

      {/* Photo + Material actions */}
      {hasStarted && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowPhotoForm(!showPhotoForm)}
            className="bg-solid-blue text-white font-heading font-600 py-3 rounded-xl active:opacity-90 flex items-center justify-center gap-2"
          >
            📷 Φωτογραφία
          </button>
          <button
            onClick={() => setShowMaterialForm(!showMaterialForm)}
            className="bg-solid-blue text-white font-heading font-600 py-3 rounded-xl active:opacity-90 flex items-center justify-center gap-2"
          >
            📦 Υλικό
          </button>
        </div>
      )}

      {/* Photo form */}
      {showPhotoForm && (
        <div className="card space-y-3">
          <h4 className="font-heading font-700 text-solid-blue text-sm">Προσθήκη φωτογραφίας</h4>
          <div className="flex gap-2 flex-wrap">
            {PHOTO_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setPhotoType(t.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  photoType === t.value
                    ? 'bg-solid-blue text-white border-solid-blue'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="input-field"
            placeholder="Σχόλιο (προαιρετικό)"
            value={photoCaption}
            onChange={e => setPhotoCaption(e.target.value)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!!loading}
            className="btn-primary"
          >
            {loading === 'photo' ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Ανέβασμα...
              </span>
            ) : '📷 Λήψη φωτογραφίας'}
          </button>
        </div>
      )}

      {/* Material form */}
      {showMaterialForm && (
        <div className="card space-y-3">
          <h4 className="font-heading font-700 text-solid-blue text-sm">Καταγραφή υλικού</h4>
          <input
            type="text"
            className="input-field"
            placeholder="Όνομα υλικού"
            value={materialName}
            onChange={e => setMaterialName(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="number"
              className="input-field"
              placeholder="Ποσότητα"
              value={materialQty}
              onChange={e => setMaterialQty(e.target.value)}
              step="0.5"
            />
            <select
              className="input-field w-28"
              value={materialUnit}
              onChange={e => setMaterialUnit(e.target.value)}
            >
              {MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <input
            type="text"
            className="input-field"
            placeholder="Σημειώσεις (προαιρετικό)"
            value={materialNotes}
            onChange={e => setMaterialNotes(e.target.value)}
          />
          <button
            onClick={handleMaterialSubmit}
            disabled={!!loading}
            className="btn-primary"
          >
            {loading === 'material' ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Αποθήκευση...
              </span>
            ) : '💾 Αποθήκευση'}
          </button>
        </div>
      )}
    </div>
  )
}
