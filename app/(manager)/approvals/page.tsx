"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PendingPhoto {
  id: string;
  s3_key: string;
  photo_type: string;
  caption: string | null;
  created_at: string;
  assignment_id: string;
  worker_assignments: {
    job_title: string;
    job_address: string;
  };
  worker_accounts: {
    display_name: string;
    full_name: string;
  };
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

const photoTypeLabels: Record<string, string> = {
  before: "Πριν", during: "Κατά τη διάρκεια", after: "Μετά", material: "Υλικό", issue: "Πρόβλημα",
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = getCookie("worker_token");
    const isManager = getCookie("worker_is_manager");
    if (!token) { router.push("/login"); return; }
    if (isManager !== "true") { router.push("/dashboard"); return; }
    fetchPending(token);
  }, [router]);

  const fetchPending = async (token: string) => {
    try {
      const res = await fetch("/api/photos/upload?pending=true", {
        headers: { "x-worker-token": token },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setPhotos(data.photos || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (photoId: string, approved: boolean) => {
    const token = getCookie("worker_token")!;
    setProcessing(photoId);
    try {
      const res = await fetch(`/api/photos/${photoId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({
          approved,
          review_note: reviewNote[photoId] || "",
        }),
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setReviewNote((prev) => { const n = {...prev}; delete n[photoId]; return n; });
      }
    } finally {
      setProcessing(null);
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
        <h1 className="text-white text-xl font-bold font-heading">Εγκρίσεις Φωτογραφιών</h1>
        <p className="text-blue-200 text-sm mt-1">{photos.length} εκκρεμείς</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {photos.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-gray-600">Όλες εγκεκριμένες!</p>
            <p className="text-gray-400 text-sm mt-1">Δεν υπάρχουν εκκρεμείς φωτογραφίες</p>
          </div>
        ) : (
          photos.map((photo) => (
            <div key={photo.id} className="card space-y-3">
              {/* Photo header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="status-pill bg-amber-100 text-amber-700">
                    {photoTypeLabels[photo.photo_type] || photo.photo_type}
                  </span>
                  <p className="font-semibold text-[#0B2265] text-sm mt-1">
                    {photo.worker_assignments?.job_title}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {photo.worker_accounts?.full_name} · {new Date(photo.created_at).toLocaleString("el-GR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Photo placeholder (S3 key) */}
              <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center">
                  <div className="text-2xl mb-1">📸</div>
                  <p className="text-xs font-mono truncate max-w-[200px]">{photo.s3_key.split("/").pop()}</p>
                </div>
              </div>

              {photo.caption && (
                <p className="text-gray-600 text-sm italic">"{photo.caption}"</p>
              )}

              {/* Review note */}
              <input
                type="text"
                value={reviewNote[photo.id] || ""}
                onChange={(e) => setReviewNote((prev) => ({ ...prev, [photo.id]: e.target.value }))}
                placeholder="Σχόλιο (προαιρετικό)..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3FAE5A]"
              />

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDecision(photo.id, true)}
                  disabled={processing === photo.id}
                  className="bg-[#3FAE5A] hover:bg-[#2E9449] text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {processing === photo.id ? "..." : "✅ Έγκριση"}
                </button>
                <button
                  onClick={() => handleDecision(photo.id, false)}
                  disabled={processing === photo.id}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {processing === photo.id ? "..." : "❌ Απόρριψη"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
