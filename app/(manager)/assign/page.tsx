"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Worker {
  id: string;
  full_name: string;
  display_name: string;
  phone_number: string;
  is_active: boolean;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function AssignPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    worker_id: "",
    job_title: "",
    job_address: "",
    job_description: "",
    assigned_date: today,
    start_time: "08:00",
    notes: "",
  });

  useEffect(() => {
    const token = getCookie("worker_token");
    const isManager = getCookie("worker_is_manager");
    if (!token) { router.push("/login"); return; }
    if (isManager !== "true") { router.push("/dashboard"); return; }
    fetchWorkers(token);
  }, [router]);

  const fetchWorkers = async (token: string) => {
    try {
      const res = await fetch("/api/jobs?workers=true", {
        headers: { "x-worker-token": token },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      const activeWorkers = (data.workers || []).filter((w: Worker) => !w.is_active || true);
      setWorkers(activeWorkers);
      if (activeWorkers.length > 0) {
        setForm((f) => ({ ...f, worker_id: activeWorkers[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.worker_id || !form.job_title || !form.job_address) {
      setError("Συμπληρώστε τα υποχρεωτικά πεδία");
      return;
    }
    const token = getCookie("worker_token")!;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm((f) => ({
          ...f,
          job_title: "",
          job_address: "",
          job_description: "",
          notes: "",
          start_time: "08:00",
        }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Σφάλμα ανάθεσης");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2265] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <div className="bg-[#0B2265] px-5 pt-12 pb-5 safe-top">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-3">← Πίσω</button>
        <h1 className="text-white text-xl font-bold font-heading">Νέα Ανάθεση</h1>
        <p className="text-blue-200 text-sm mt-1">Ανάθεση εργασίας σε εργαζόμενο</p>
      </div>

      <div className="px-4 py-5">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
            ✅ Η ανάθεση καταχωρήθηκε!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* Worker */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Εργαζόμενος *</label>
            <select
              value={form.worker_id}
              onChange={(e) => setForm((f) => ({ ...f, worker_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A] bg-white"
            >
              {workers.length === 0 && <option value="">Δεν υπάρχουν εργαζόμενοι</option>}
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.full_name} ({w.phone_number})</option>
              ))}
            </select>
          </div>

          {/* Job title */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Τίτλος Έργου *</label>
            <input
              type="text"
              value={form.job_title}
              onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
              placeholder="π.χ. Αποχέτευση Κολωνακίου Β2"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Διεύθυνση *</label>
            <input
              type="text"
              value={form.job_address}
              onChange={(e) => setForm((f) => ({ ...f, job_address: e.target.value }))}
              placeholder="π.χ. Σκουφά 12, Κολωνάκι"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Περιγραφή</label>
            <textarea
              value={form.job_description}
              onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
              placeholder="Οδηγίες εργασίας..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A] resize-none"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#0B2265] mb-1">Ημερομηνία</label>
              <input
                type="date"
                value={form.assigned_date}
                onChange={(e) => setForm((f) => ({ ...f, assigned_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0B2265] mb-1">Ώρα έναρξης</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Σημειώσεις</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Επιπλέον οδηγίες..."
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || workers.length === 0}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "Αποθήκευση..." : "📋 Ανάθεση Εργασίας"}
          </button>
        </form>
      </div>
    </div>
  );
}
