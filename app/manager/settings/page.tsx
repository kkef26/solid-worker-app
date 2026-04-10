'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Worker = {
  id: string
  full_name: string
  display_name: string
  phone_number: string
  is_active: boolean
  is_manager: boolean
  role: string
  specialty: string[]
  daily_rate: number | null
  notes: string | null
  last_login_at: string | null
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Ιδιοκτήτης',
  manager: 'Διαχειριστής',
  worker: 'Εργάτης',
  subcontractor: 'Υπεργολάβος',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-blue-100 text-blue-800',
  manager: 'bg-purple-100 text-purple-800',
  worker: 'bg-green-100 text-green-800',
  subcontractor: 'bg-amber-100 text-amber-800',
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

export default function SettingsPage() {
  const router = useRouter()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', display_name: '', phone_number: '+30', role: 'worker',
    specialty: '', daily_rate: '', notes: '', pin: '',
  })

  useEffect(() => {
    const token = getCookie('worker_token')
    const isManager = getCookie('worker_is_manager')
    if (!token) { router.push('/worker/login'); return }
    if (isManager !== 'true') { router.push('/worker/dashboard'); return }
    fetchWorkers(token)
  }, [router])

  async function fetchWorkers(token: string) {
    try {
      const res = await fetch('/api/workers/list', { headers: { 'x-worker-token': token } })
      if (res.ok) {
        const data = await res.json()
        setWorkers(data.workers || [])
      }
    } finally {
      setLoading(false)
    }
  }

  function openEdit(w: Worker) {
    setEditing(w.id); setAdding(false)
    setForm({
      full_name: w.full_name, display_name: w.display_name, phone_number: w.phone_number,
      role: w.role, specialty: (w.specialty || []).join(', '),
      daily_rate: w.daily_rate?.toString() || '', notes: w.notes || '', pin: '',
    })
  }

  function openAdd() {
    setEditing(null); setAdding(true)
    setForm({ full_name: '', display_name: '', phone_number: '+30', role: 'worker', specialty: '', daily_rate: '', notes: '', pin: '1234' })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        full_name: form.full_name, display_name: form.display_name || form.full_name.split(' ').pop(),
        phone_number: form.phone_number, role: form.role,
        is_manager: form.role === 'owner' || form.role === 'manager',
        specialty: form.specialty ? form.specialty.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : [],
        daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
        notes: form.notes || null,
      }
      if (form.pin) body.pin = form.pin

      const url = editing ? `/api/workers/${editing}` : '/api/workers'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Σφάλμα')

      if (editing) {
        setWorkers(prev => prev.map(w => w.id === editing ? { ...w, ...data.worker } : w))
      } else {
        setWorkers(prev => [...prev, data.worker])
      }
      setEditing(null); setAdding(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης')
    } finally { setSaving(false) }
  }

  async function toggleActive(w: Worker) {
    const res = await fetch(`/api/workers/${w.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !w.is_active }),
    })
    if (res.ok) setWorkers(prev => prev.map(x => x.id === w.id ? { ...x, is_active: !w.is_active } : x))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2265] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const showForm = editing || adding

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      {/* Header */}
      <div className="bg-[#0B2265] px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">Ρυθμίσεις</p>
            <h1 className="text-white text-xl font-bold">Διαχείριση Εργατών</h1>
          </div>
          <button onClick={() => router.push('/manager/overview')} className="text-blue-200 text-sm bg-white/10 px-3 py-1.5 rounded-lg">
            ← Πίσω
          </button>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-bold text-2xl">{workers.filter(w => w.is_active).length}</p>
            <p className="text-white/60 text-xs">Ενεργοί</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-bold text-2xl">{workers.filter(w => w.role === 'worker').length}</p>
            <p className="text-white/60 text-xs">Εργάτες</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <p className="text-white font-bold text-2xl">{workers.filter(w => w.role === 'subcontractor').length}</p>
            <p className="text-white/60 text-xs">Υπεργολάβοι</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-3 pb-28">
        {/* Worker Cards */}
        {workers.map(w => (
          <div key={w.id} className={`bg-white rounded-xl shadow-sm p-4 ${!w.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                w.is_active
                  ? w.role === 'owner' ? 'bg-blue-600'
                  : w.role === 'manager' ? 'bg-purple-500'
                  : w.role === 'subcontractor' ? 'bg-amber-500'
                  : 'bg-green-500'
                  : 'bg-gray-300'
              }`}>
                {w.display_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[#0B2265] text-sm">{w.full_name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ROLE_COLORS[w.role] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[w.role] || w.role}
                  </span>
                  {!w.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600">Ανενεργός</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{w.phone_number}</p>
                {w.specialty && w.specialty.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {w.specialty.map(s => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
                {w.daily_rate && <p className="text-xs text-green-600 font-bold mt-1">€{w.daily_rate}/ημέρα</p>}
                {w.notes && <p className="text-xs text-gray-400 mt-1 italic">{w.notes}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => openEdit(w)} className="text-xs bg-[#E8EEF8] text-[#0B2265] px-3 py-1.5 rounded-lg font-bold">✏️</button>
                <button onClick={() => toggleActive(w)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold ${w.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {w.is_active ? '⏸️' : '▶️'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Button */}
        {!showForm && (
          <button onClick={openAdd}
            className="w-full py-3 border-2 border-dashed border-[#3FAE5A] rounded-xl text-[#3FAE5A] font-bold text-sm flex items-center justify-center gap-2">
            <span className="text-lg">+</span> Προσθήκη Εργάτη
          </button>
        )}

        {/* Edit/Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-[#0B2265]">
            <h3 className="font-bold text-[#0B2265] text-base mb-4">{editing ? 'Επεξεργασία' : 'Νέος Εργάτης'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ονοματεπώνυμο *</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Γεωργίου Δημήτρης" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ψευδώνυμο</label>
                  <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Δημήτρης" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Τηλέφωνο *</label>
                  <input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="+306912345678" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ρόλος</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="worker">Εργάτης</option>
                    <option value="subcontractor">Υπεργολάβος</option>
                    <option value="manager">Διαχειριστής</option>
                    <option value="owner">Ιδιοκτήτης</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ημερομίσθιο (€)</label>
                  <input type="number" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="80" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ειδικότητες (κόμμα)</label>
                <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Σοβαδίσματα, Επιχρίσματα" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {editing ? 'Νέο PIN (κενό = χωρίς αλλαγή)' : 'PIN *'}
                </label>
                <input type="text" inputMode="numeric" maxLength={6} value={form.pin}
                  onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono tracking-widest" placeholder="1234" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Σημειώσεις</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving || !form.full_name || !form.phone_number}
                  className="flex-1 py-2.5 bg-[#3FAE5A] text-white rounded-lg font-bold text-sm disabled:opacity-40">
                  {saving ? '⏳...' : editing ? 'Ενημέρωση' : 'Δημιουργία'}
                </button>
                <button onClick={() => { setEditing(null); setAdding(false) }}
                  className="py-2.5 px-5 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm">
                  Ακύρωση
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-around z-50">
        <button onClick={() => router.push('/manager/overview')} className="flex flex-col items-center text-gray-400">
          <span className="text-xl">👷</span>
          <span className="text-[10px] font-bold">Επισκόπηση</span>
        </button>
        <button onClick={() => router.push('/manager/approvals')} className="flex flex-col items-center text-gray-400">
          <span className="text-xl">✅</span>
          <span className="text-[10px] font-bold">Εγκρίσεις</span>
        </button>
        <button onClick={() => router.push('/manager/assign')} className="flex flex-col items-center text-gray-400">
          <span className="text-xl">📋</span>
          <span className="text-[10px] font-bold">Ανάθεση</span>
        </button>
        <button className="flex flex-col items-center text-[#0B2265]">
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] font-bold">Ρυθμίσεις</span>
        </button>
      </div>
    </div>
  )
}
