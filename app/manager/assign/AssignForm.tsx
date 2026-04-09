'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Worker = { id: string; display_name: string; full_name: string }

export default function AssignForm({ workers, managerId }: { workers: Worker[]; managerId: string }) {
  const router = useRouter()
  const [workerId, setWorkerId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workerId || !jobTitle || !jobAddress) {
      setError('Συμπληρώστε εργάτη, τίτλο και διεύθυνση')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: workerId,
          job_title: jobTitle,
          job_address: jobAddress,
          job_description: jobDescription,
          assigned_date: assignedDate,
          start_time: startTime || null,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Σφάλμα αποθήκευσης')
      } else {
        setSuccess(true)
        setJobTitle('')
        setJobAddress('')
        setJobDescription('')
        setNotes('')
        setStartTime('')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      setError('Σφάλμα. Δοκιμάστε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-600">
          ✅ Η εργασία ανατέθηκε!
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <label className="block text-solid-blue font-heading font-700 text-sm mb-2">Εργάτης *</label>
          <select className="input-field" value={workerId} onChange={e => setWorkerId(e.target.value)} required>
            <option value="">Επιλέξτε εργάτη...</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-solid-blue font-heading font-700 text-sm mb-2">Τίτλος εργασίας *</label>
          <input type="text" className="input-field" placeholder="π.χ. Ανακαίνιση μπάνιου" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
        </div>

        <div>
          <label className="block text-solid-blue font-heading font-700 text-sm mb-2">Διεύθυνση *</label>
          <input type="text" className="input-field" placeholder="π.χ. Αθήνα, Κολωνάκι 15" value={jobAddress} onChange={e => setJobAddress(e.target.value)} required />
        </div>

        <div>
          <label className="block text-solid-blue font-heading font-700 text-sm mb-2">Περιγραφή</label>
          <textarea className="input-field" rows={3} placeholder="Οδηγίες για τον εργάτη..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-solid-blue font-heading font-700 text-sm mb-2">Ημερομηνία</label>
            <input type="date" className="input-field" value={assignedDate} onChange={e => setAssignedDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-solid-blue font-heading font-700 text-sm mb-2">Ώρα έναρξης</label>
            <input type="time" className="input-field" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-solid-blue font-heading font-700 text-sm mb-2">Σημειώσεις</label>
          <input type="text" className="input-field" placeholder="Επιπλέον οδηγίες..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? (
          <span className="inline-flex items-center gap-2 justify-center">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Αποθήκευση...
          </span>
        ) : '📋 Ανάθεση εργασίας'}
      </button>
    </form>
  )
}
