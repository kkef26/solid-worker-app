"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Assignment {
  id: string;
  job_title: string;
  assigned_date: string;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function MaterialsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    assignment_id: "",
    material_name: "",
    quantity: "",
    unit: "τεμ.",
    notes: "",
  });

  useEffect(() => {
    const token = getCookie("worker_token");
    if (!token) { router.push("/worker/login"); return; }
    fetchAssignments(token);
  }, [router]);

  const fetchAssignments = async (token: string) => {
    try {
      const res = await fetch("/api/jobs", { headers: { "x-worker-token": token } });
      if (res.status === 401) { router.push("/worker/login"); return; }
      const data = await res.json();
      setAssignments(data.assignments || []);
      if (data.assignments?.length > 0) {
        setForm((f) => ({ ...f, assignment_id: data.assignments[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assignment_id || !form.material_name || !form.quantity) {
      setError("Συμπληρώστε όλα τα υποχρεωτικά πεδία");
      return;
    }
    const token = getCookie("worker_token")!;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({
          assignment_id: form.assignment_id,
          material_name: form.material_name,
          quantity: parseFloat(form.quantity),
          unit: form.unit,
          notes: form.notes,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setForm((f) => ({ ...f, material_name: "", quantity: "", notes: "" }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Σφάλμα καταχώρησης");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const units = ["τεμ.", "m", "m²", "m³", "kg", "L", "σακιά", "κιβώτια", "σωλήνες"];

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
        <h1 className="text-white text-xl font-bold font-heading">Αίτηση Υλικών</h1>
        <p className="text-blue-200 text-sm mt-1">Καταγραφή υλικών εργοταξίου</p>
      </div>

      <div className="px-4 py-5">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
            ✅ Το υλικό καταχωρήθηκε επιτυχώς!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* Assignment select */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Έργο *</label>
            <select
              value={form.assignment_id}
              onChange={(e) => setForm((f) => ({ ...f, assignment_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A] bg-white"
            >
              {assignments.length === 0 && <option value="">Δεν υπάρχουν αναθέσεις</option>}
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.job_title}</option>
              ))}
            </select>
          </div>

          {/* Material name */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Υλικό *</label>
            <input
              type="text"
              value={form.material_name}
              onChange={(e) => setForm((f) => ({ ...f, material_name: e.target.value }))}
              placeholder="π.χ. Τσιμέντο Portland, Γωνιόπρεσα, Μάρμαρο..."
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
            />
          </div>

          {/* Quantity + unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#0B2265] mb-1">Ποσότητα *</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0B2265] mb-1">Μονάδα</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A] bg-white"
              >
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#0B2265] mb-1">Σημειώσεις</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Χρώμα, τύπος, προμηθευτής..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || assignments.length === 0}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "Καταχώρηση..." : "🧱 Καταχώρηση Υλικού"}
          </button>
        </form>
      </div>
    </div>
  );
}
