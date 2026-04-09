"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Assignment {
  id: string;
  job_title: string;
  job_address: string;
  job_description: string | null;
  assigned_date: string;
  start_time: string | null;
  notes: string | null;
  checked_in?: boolean;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerName, setWorkerName] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie("worker_token");
    if (!token) {
      router.push("/worker/login");
      return;
    }
    fetchAssignments(token);
  }, [router]);

  const fetchAssignments = async (token: string) => {
    try {
      const res = await fetch("/api/jobs", {
        headers: { "x-worker-token": token },
      });
      if (res.status === 401) {
        router.push("/worker/login");
        return;
      }
      const data = await res.json();
      setAssignments(data.assignments || []);
      setWorkerName(data.worker_name || "");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (assignmentId: string, type: "start" | "end") => {
    setCheckingIn(assignmentId);
    const token = getCookie("worker_token");

    if (!navigator.geolocation) {
      await postCheckin(assignmentId, type, null, null, null, token!);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await postCheckin(
          assignmentId,
          type,
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
          token!
        );
      },
      async () => {
        await postCheckin(assignmentId, type, null, null, null, token!);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const postCheckin = async (
    assignmentId: string,
    type: string,
    lat: number | null,
    lng: number | null,
    accuracy: number | null,
    token: string
  ) => {
    try {
      await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({
          assignment_id: assignmentId,
          checkin_type: type,
          latitude: lat,
          longitude: lng,
          accuracy_meters: accuracy,
        }),
      });
      await fetchAssignments(token);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleLogout = () => {
    document.cookie = "worker_token=; path=/; max-age=0";
    document.cookie = "worker_is_manager=; path=/; max-age=0";
    router.push("/worker/login");
  };

  const today = new Date().toLocaleDateString("el-GR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2265] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      {/* Header */}
      <div className="bg-[#0B2265] px-5 pt-12 pb-6 safe-top">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-sm">Καλημέρα,</p>
            <h1 className="text-white text-xl font-bold font-heading">{workerName || "Εργαζόμενος"}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-blue-200 text-sm bg-white/10 px-3 py-1.5 rounded-lg"
          >
            Έξοδος
          </button>
        </div>
        <p className="text-blue-300 text-sm capitalize">{today}</p>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-4">
        <h2 className="text-[#0B2265] font-bold text-lg font-heading">
          Σημερινά Έργα ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🏗️</div>
            <p className="text-gray-500 font-semibold">Δεν υπάρχουν αναθέσεις σήμερα</p>
            <p className="text-gray-400 text-sm mt-1">Επικοινωνήστε με τον διαχειριστή</p>
          </div>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-[#0B2265] font-heading text-base leading-tight">
                    {a.job_title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
                    <span>📍</span> {a.job_address}
                  </p>
                </div>
                {a.start_time && (
                  <span className="text-xs bg-blue-50 text-[#0B2265] px-2 py-1 rounded-lg font-semibold ml-2 shrink-0">
                    {a.start_time.slice(0, 5)}
                  </span>
                )}
              </div>

              {a.job_description && (
                <p className="text-gray-600 text-sm">{a.job_description}</p>
              )}

              {a.notes && (
                <p className="text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg">
                  📝 {a.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleCheckin(a.id, "start")}
                  disabled={checkingIn === a.id}
                  className="flex-1 bg-[#3FAE5A] hover:bg-[#2E9449] active:bg-[#2E9449] text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {checkingIn === a.id ? "..." : "✅ ΠΑΡΟΥΣΙΑΣΗ"}
                </button>
                <button
                  onClick={() => router.push(`/worker/job/${a.id}`)}
                  className="flex-1 bg-[#0B2265] hover:bg-[#0a1d58] text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  📸 Λεπτομέρειες
                </button>
              </div>
            </div>
          ))
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => router.push("/worker/materials")}
            className="card flex flex-col items-center py-5 gap-2 hover:shadow-md active:shadow-none transition-shadow"
          >
            <span className="text-2xl">🧱</span>
            <span className="text-sm font-semibold text-[#0B2265]">Υλικά</span>
          </button>
          <button
            onClick={() => {
              const isManager = getCookie("worker_is_manager") === "true";
              if (isManager) router.push("/manager/overview");
            }}
            className="card flex flex-col items-center py-5 gap-2 hover:shadow-md active:shadow-none transition-shadow"
            id="manager-link"
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-semibold text-[#0B2265]">Διαχείριση</span>
          </button>
        </div>
      </div>
    </div>
  );
}
