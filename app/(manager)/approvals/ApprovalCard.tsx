'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Props = {
  photo: {
    id: string
    photo_type: string
    caption: string | null
    view_url: string | null
    worker_accounts: { display_name: string; full_name: string } | null
    worker_assignments: { job_title: string; job_address: string } | null
    created_at: string
  }
  managerId: string
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: 'Πριν', during: 'Κατά τη διάρκεια', after: 'Μετά', material: 'Υλικό', issue: 'Πρόβλημα'
}

export default function ApprovalCard({ photo, managerId }: Props) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [showNote, setShowNote] = useState(false)

  async function handleAction(action: 'approved' | 'rejected') {
    setLoading(action === 'approved' ? 'approve' : 'reject')
    try {
      const res = await fetch(`/api/photos/${photo.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, review_note: note }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-heading font-700 text-solid-blue text-sm">
            {photo.worker_accounts?.display_name ?? '—'}
          </p>
          <p className="text-gray-500 text-xs">{photo.worker_assignments?.job_title ?? '—'}</p>
          <p className="text-gray-400 text-xs">📍 {photo.worker_assignments?.job_address ?? '—'}</p>
        </div>
        <div className="text-right">
          <span className="text-xs bg-solid-concrete text-solid-blue px-2 py-1 rounded-full font-600">
            {PHOTO_TYPE_LABELS[photo.photo_type] ?? photo.photo_type}
          </span>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(photo.created_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Photo */}
      {photo.view_url ? (
        <div className="relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden">
          <Image src={photo.view_url} alt="Φωτογραφία" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
          <span className="text-3xl">🖼️</span>
        </div>
      )}

      {photo.caption && (
        <p className="text-gray-600 text-sm italic">"{photo.caption}"</p>
      )}

      {/* Note input (for rejection) */}
      {showNote && (
        <input
          type="text"
          className="input-field"
          placeholder="Σχόλιο απόρριψης..."
          value={note}
          onChange={e => setNote(e.target.value)}
          autoFocus
        />
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleAction('approved')}
          disabled={!!loading}
          className="flex-1 bg-solid-green text-white font-heading font-700 py-3 rounded-xl active:bg-solid-green-hover flex items-center justify-center gap-2"
        >
          {loading === 'approve' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '✓'}
          Έγκριση
        </button>
        <button
          onClick={() => {
            if (!showNote) { setShowNote(true); return }
            handleAction('rejected')
          }}
          disabled={!!loading}
          className="flex-1 bg-red-100 text-red-700 font-heading font-700 py-3 rounded-xl active:bg-red-200 flex items-center justify-center gap-2"
        >
          {loading === 'reject' ? (
            <span className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          ) : '✗'}
          Απόρριψη
        </button>
      </div>
    </div>
  )
}
