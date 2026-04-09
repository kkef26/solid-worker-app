"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface WorkerStatus {
  id: string;
  full_name: string;
  display_name: string;
  phone_number: string;
  is_active: boolean;
  today_assignments: number;
  checked_in: boolean;
  pending_photos: number;
}

interface Stats {
  total_workers: number;
  checked_in_today: number;
  pending_photos: number;
  today_assignments: number;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function ManagerOverviewPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [managerName, setManagerName] = useState("");

  useEffect(() => {
    const token = getCookie("worker_token");
    const isManager = getCookie("worker_is_manager");
    if (!token) { router.push("/login"); return; }
    if (isManager !== "true") { router.push("/dashboard"); return; }
    fetchOverview(token);
  }, [router]);

  const fetchOverview = async (token: string) => {
    try {
      const res = await fetch("/api/jobs?overview=true", {
        headers: { "x-worker-token": token },
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 403) { router.push("/dashboard"); return; }
      const data = await res.json();
      setWorkers(data.workers || []);
      setStats(data.stats || null);
      setManagerName(data.manager_name || "");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "worker_token=; path=/; max-age=0";
    document.cookie = "worker_is_manager=; path=/; max-age=0";
    router.push("/login");
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
      {/* Header */}
      <div className="bg-[#0B2265] px-5 pt-12 pb-5 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">Διαχείριση</p>
            <h1 className="text-white text-xl font-bold font-heading">{managerName}</h1>
          </div>
          <button onClick={handleLogout} className="text-blue-200 text-sm bg-white/10 px-3 py-1.5 rounded-lg">
            Έξοδος
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Εργαζόμενοι", value: stats.total_workers, icon: "👷", color: "bg-blue-50 text-[#0B2265]" },
              { label: "Παρόντες σήμερα", value: stats.checked_in_today, icon: "✅", color: "bg-green-50 text-green-700" },
              { label: "Εκκρεμείς φωτ.", value: stats.pending_photos, icon: "📸", color: "bg-amber-50 text-amber-700" },
              { label: "Αναθέσεις σήμερα", value: stats.today_assignments, icon: "🏗️", color: "bg-purple-50 text-purple-700" },
            ].map((s) => (
              <div key={s.label} className={`card ${s.color}`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black font-heading">{s.value}</div>
                <div className="text-xs font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/approvals")}
            className="btn-primary text-sm py-3"
          >
            📸 Εγκρίσεις Φωτ.
            {stats?.pending_photos ? (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                {stats.pending_photos}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => router.push("/assign")}
            className="btn-secondary text-sm py-3"
          >
            📋 Νέα Ανάθεση
          </button>
        </div>

        {/* Worker grid */}
        <div>
          <h2 className="text-[#0B2265] font-bold font-heading mb-3">Εργαζόμενοι</h2>
          <div className="space-y-3">
            {workers.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">
                <p>Δεν υπάρχουν εγγεγραμμένοι εργαζόμενοι</p>
              </div>
            ) : (
              workers.map((w) => (
                <div key={w.id} className="card flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                    w.checked_in ? "bg-[#3FAE5A]" : "bg-gray-300"
                  }`}>
                    {w.display_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0B2265] text-sm">{w.full_name}</p>
                    <p className="text-gray-400 text-xs">{w.phone_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`status-pill ${
                      w.checked_in ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {w.checked_in ? "✅ Παρών" : "Απών"}
                    </span>
                    {w.pending_photos > 0 && (
                      <p className="text-amber-600 text-xs mt-1">
                        📸 {w.pending_photos} εκκρεμείς
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
