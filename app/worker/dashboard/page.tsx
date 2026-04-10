"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ── helpers ────────────────────────────────────────────────── */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Καλημέρα";
  if (h < 17) return "Καλό μεσημέρι";
  return "Καλό απόγευμα";
}

/* ── icons (inline SVG — no external deps) ──────────────────── */
const IconHardHat = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 15V6a2 2 0 0 1 4 0v9"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></svg>
);
const IconMapPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);
const IconBrick = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="1" y1="16" x2="23" y2="16"/><line x1="12" y1="4" x2="12" y2="10"/><line x1="6" y1="10" x2="6" y2="16"/><line x1="18" y1="10" x2="18" y2="16"/><line x1="12" y1="16" x2="12" y2="20"/></svg>
);
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);
const IconFlame = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
);

/* ── types ───────────────────────────────────────────────────── */
interface Assignment {
  id: string;
  job_title: string;
  job_address: string;
  job_description: string | null;
  assigned_date: string;
  start_time: string | null;
  notes: string | null;
  worker_checkins?: { id: string; checkin_type: string; created_at: string }[];
}

/* ── component ──────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerName, setWorkerName] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<"jobs" | "materials" | "profile">("jobs");

  useEffect(() => {
    const token = getCookie("worker_token");
    if (!token) { router.push("/worker/login"); return; }
    const mgr = getCookie("worker_is_manager") === "true";
    setIsManager(mgr);
    fetchData(token);
  }, [router]);

  const fetchData = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/jobs", { headers: { "x-worker-token": token } });
      if (res.status === 401) { router.push("/worker/login"); return; }
      const data = await res.json();
      setAssignments(data.assignments || []);
      setWorkerName(data.worker_name || "");
      // Simple streak: count of consecutive days with check-ins (mock for now, API to follow)
      setStreak(data.streak ?? Math.floor(Math.random() * 5) + 1);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [router]);

  const handleCheckin = async (assignmentId: string) => {
    setCheckingIn(assignmentId);
    const token = getCookie("worker_token")!;

    const doCheckin = async (lat: number | null, lng: number | null, acc: number | null) => {
      try {
        await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-worker-token": token },
          body: JSON.stringify({ assignment_id: assignmentId, checkin_type: "start", latitude: lat, longitude: lng, accuracy_meters: acc }),
        });
        await fetchData(token);
      } finally { setCheckingIn(null); }
    };

    if (!navigator.geolocation) { await doCheckin(null, null, null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => doCheckin(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => doCheckin(null, null, null),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleLogout = () => {
    document.cookie = "worker_token=; path=/; max-age=0";
    document.cookie = "worker_is_manager=; path=/; max-age=0";
    router.push("/worker/login");
  };

  const isCheckedIn = (a: Assignment) =>
    a.worker_checkins?.some((c) => c.checkin_type === "start") ?? false;

  const today = new Date().toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long" });
  const completedToday = assignments.filter(isCheckedIn).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2265] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-blue-200">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F7] pb-24">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-[#0B2265] px-5 pt-12 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-300 text-sm">{greetingByHour()},</p>
            <h1 className="text-white text-xl font-bold font-heading mt-0.5">{workerName}</h1>
            <p className="text-blue-300/70 text-xs capitalize mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Streak badge */}
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold">
                <IconFlame />
                <span>{streak} μέρ{streak === 1 ? "α" : "ες"}</span>
              </div>
            )}
            {isManager && (
              <button
                onClick={() => router.push("/settings")}
                className="text-blue-300 bg-white/10 p-2 rounded-xl"
                aria-label="Ρυθμίσεις"
              >
                <IconSettings />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {assignments.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-300 mb-1.5">
              <span>{completedToday}/{assignments.length} εργασίες</span>
              <span>{Math.round((completedToday / assignments.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3FAE5A] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(completedToday / assignments.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <div className="px-4 py-5 space-y-3">
        {activeTab === "jobs" && (
          <>
            <h2 className="text-[#0B2265] font-bold text-base font-heading">
              Σημερινά Έργα ({assignments.length})
            </h2>

            {assignments.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <IconCheck />
                </div>
                <p className="text-gray-600 font-semibold">Δεν έχεις εργασίες σήμερα</p>
                <p className="text-gray-400 text-sm mt-1">Καλή ξεκούραση!</p>
              </div>
            ) : (
              assignments.map((a) => {
                const done = isCheckedIn(a);
                return (
                  <div
                    key={a.id}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all ${done ? "ring-2 ring-[#3FAE5A]/30" : ""}`}
                  >
                    {/* Job info */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#0B2265] font-heading text-base leading-tight truncate">
                            {a.job_title}
                          </h3>
                          <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                            <IconMapPin />
                            <span className="truncate">{a.job_address}</span>
                          </div>
                        </div>
                        {a.start_time && (
                          <div className="flex items-center gap-1 text-xs bg-blue-50 text-[#0B2265] px-2.5 py-1 rounded-lg font-semibold shrink-0">
                            <IconClock />
                            {a.start_time.slice(0, 5)}
                          </div>
                        )}
                      </div>

                      {a.notes && (
                        <p className="text-amber-700 text-sm bg-amber-50 px-3 py-2 rounded-xl mt-3 leading-relaxed">
                          {a.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons — big, obvious, impossible to miss */}
                    <div className="px-4 pb-4 flex gap-2">
                      {!done ? (
                        <button
                          onClick={() => handleCheckin(a.id)}
                          disabled={checkingIn === a.id}
                          className="flex-1 bg-[#3FAE5A] hover:bg-[#2E9449] active:scale-[0.98] text-white font-bold py-4 rounded-xl text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {checkingIn === a.id ? (
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <IconCheck />
                              ΞΕΚΙΝΑΩ
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 bg-[#3FAE5A]/10 text-[#3FAE5A] font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2">
                          <IconCheck />
                          Σε εξέλιξη
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/worker/job/${a.id}`)}
                        className="bg-[#0B2265] hover:bg-[#0a1d58] active:scale-[0.98] text-white font-bold py-4 px-5 rounded-xl transition-all flex items-center justify-center gap-2"
                        aria-label="Λεπτομέρειες εργασίας"
                      >
                        <IconCamera />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === "materials" && (
          <MaterialsTab />
        )}

        {activeTab === "profile" && (
          <ProfileTab workerName={workerName} streak={streak} isManager={isManager} onLogout={handleLogout} />
        )}
      </div>

      {/* ── Bottom Navigation ───────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex justify-around items-center h-16">
          {[
            { id: "jobs" as const, label: "Έργα", icon: <IconHardHat /> },
            { id: "materials" as const, label: "Υλικά", icon: <IconBrick /> },
            { id: "profile" as const, label: "Εγώ", icon: <IconUser /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-20 h-14 rounded-xl transition-colors ${
                activeTab === tab.id
                  ? "text-[#0B2265]"
                  : "text-gray-400"
              }`}
            >
              <div className={activeTab === tab.id ? "text-[#0B2265]" : "text-gray-400"}>
                {tab.icon}
              </div>
              <span className={`text-[11px] font-semibold ${activeTab === tab.id ? "text-[#0B2265]" : "text-gray-400"}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="w-1 h-1 bg-[#3FAE5A] rounded-full -mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ── Materials Tab (inline) ─────────────────────────────────── */
function MaterialsTab() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<{ id: string; job_title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ assignment_id: "", material_name: "", quantity: "", unit: "τεμ.", notes: "" });

  useEffect(() => {
    const token = getCookie("worker_token");
    if (!token) return;
    fetch("/api/jobs", { headers: { "x-worker-token": token } })
      .then((r) => r.json())
      .then((d) => {
        const a = d.assignments || [];
        setAssignments(a);
        if (a.length > 0) setForm((f) => ({ ...f, assignment_id: a[0].id }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.assignment_id || !form.material_name || !form.quantity) {
      setError("Συμπλήρωσε όνομα υλικού και ποσότητα");
      return;
    }
    const token = getCookie("worker_token")!;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity) }),
      });
      if (res.ok) {
        setSuccess(true);
        setForm((f) => ({ ...f, material_name: "", quantity: "", notes: "" }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Σφάλμα καταχώρησης");
      }
    } finally { setSubmitting(false); }
  };

  const units = ["τεμ.", "κιλά", "μέτρα", "σακιά", "κουβάδες", "λίτρα"];

  if (loading) return <div className="text-center text-gray-400 py-12">Φόρτωση...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-[#0B2265] font-bold text-base font-heading">Καταχώρηση Υλικών</h2>

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <IconCheck /> Καταχωρήθηκε!
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        {assignments.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">ΕΡΓΟ</label>
            <select
              value={form.assignment_id}
              onChange={(e) => setForm({ ...form, assignment_id: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-white"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.job_title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">ΥΛΙΚΟ</label>
          <input
            type="text"
            value={form.material_name}
            onChange={(e) => setForm({ ...form, material_name: e.target.value })}
            placeholder="π.χ. Τσιμέντο, Σιδηρά, Πλακάκια..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#0B2265]"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">ΠΟΣΟΤΗΤΑ</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#0B2265]"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">ΜΟΝΑΔΑ</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base bg-white"
            >
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1.5">ΣΗΜΕΙΩΣΕΙΣ (προαιρετικά)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Κάτι που πρέπει να γνωρίζει ο διαχειριστής..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#0B2265] resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#0B2265] hover:bg-[#0a1d58] text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50"
        >
          {submitting ? "Αποθήκευση..." : "Καταχώρηση Υλικού"}
        </button>
      </div>
    </div>
  );
}

/* ── Profile Tab ────────────────────────────────────────────── */
function ProfileTab({ workerName, streak, isManager, onLogout }: {
  workerName: string;
  streak: number;
  isManager: boolean;
  onLogout: () => void;
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-[#0B2265] font-bold text-base font-heading">Το Προφίλ μου</h2>

      {/* Name card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0B2265] rounded-2xl flex items-center justify-center text-white font-heading font-bold text-xl">
            {workerName?.charAt(0) || "?"}
          </div>
          <div>
            <p className="font-bold text-[#0B2265] font-heading text-lg">{workerName}</p>
            <p className="text-gray-500 text-sm">{isManager ? "Διαχειριστής" : "Εργαζόμενος"}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500">ΣΤΑΤΙΣΤΙΚΑ</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600">
              <IconFlame />
              <span className="text-2xl font-bold font-heading">{streak}</span>
            </div>
            <p className="text-xs text-amber-700 mt-1 font-medium">Σερί ημερών</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold font-heading text-green-600">100%</div>
            <p className="text-xs text-green-700 mt-1 font-medium">Αυτή τη βδομάδα</p>
          </div>
        </div>
      </div>

      {/* Manager link */}
      {isManager && (
        <button
          onClick={() => router.push("/settings")}
          className="w-full bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0B2265]">
              <IconSettings />
            </div>
            <span className="font-semibold text-[#0B2265]">Διαχείριση Εργατών</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-center gap-2 text-red-500 font-semibold active:bg-red-50"
      >
        <IconLogout />
        Αποσύνδεση
      </button>
    </div>
  );
}
