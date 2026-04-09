"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

interface Photo {
  id: string;
  s3_key: string;
  photo_type: string;
  caption: string | null;
  status: string;
  created_at: string;
}

interface Checkin {
  id: string;
  checkin_type: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

interface Assignment {
  id: string;
  job_title: string;
  job_address: string;
  job_description: string | null;
  worker_checkins: Checkin[];
  worker_photos: Photo[];
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

const photoTypeLabels: Record<string, string> = {
  before: "Πριν",
  during: "Κατά τη διάρκεια",
  after: "Μετά",
  material: "Υλικό",
  issue: "Πρόβλημα",
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<string>("during");
  const [caption, setCaption] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinType, setCheckinType] = useState<string>("start");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getCookie("worker_token");
    if (!token) { router.push("/login"); return; }
    fetchAssignment(token);
  }, [assignmentId, router]);

  const fetchAssignment = async (token: string) => {
    try {
      const res = await fetch(`/api/jobs?id=${assignmentId}`, {
        headers: { "x-worker-token": token },
      });
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setAssignment(data.assignment);
    } catch {
      setError("Σφάλμα φόρτωσης");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    const token = getCookie("worker_token")!;
    setCheckingIn(true);
    setError("");

    const doCheckin = async (lat: number | null, lng: number | null, acc: number | null) => {
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-worker-token": token },
          body: JSON.stringify({
            assignment_id: assignmentId,
            checkin_type: checkinType,
            latitude: lat, longitude: lng, accuracy_meters: acc,
          }),
        });
        if (res.ok) await fetchAssignment(token);
        else setError("Σφάλμα παρουσίασης");
      } finally {
        setCheckingIn(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doCheckin(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        () => doCheckin(null, null, null),
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      doCheckin(null, null, null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getCookie("worker_token")!;
    setUploading(true);
    setError("");

    try {
      // Get presigned URL
      const presignRes = await fetch("/api/photos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({
          assignment_id: assignmentId,
          photo_type: photoType,
          caption,
          filename: file.name,
          content_type: file.type,
        }),
      });

      if (!presignRes.ok) {
        setError("Σφάλμα ανεβάσματος φωτογραφίας");
        return;
      }

      const { upload_url, s3_key } = await presignRes.json();

      // Upload directly to S3
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // Confirm upload
      await fetch("/api/photos/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({ s3_key, assignment_id: assignmentId }),
      });

      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchAssignment(token);
    } catch {
      setError("Σφάλμα ανεβάσματος");
    } finally {
      setUploading(false);
    }
  };

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

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Η ανάθεση δεν βρέθηκε</p>
          <button onClick={() => router.back()} className="text-[#0B2265] mt-4 underline">Πίσω</button>
        </div>
      </div>
    );
  }

  const latestCheckin = assignment.worker_checkins?.[assignment.worker_checkins.length - 1];

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      {/* Header */}
      <div className="bg-[#0B2265] px-5 pt-12 pb-5 safe-top">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-3 flex items-center gap-1">
          ← Πίσω
        </button>
        <h1 className="text-white text-xl font-bold font-heading leading-tight">{assignment.job_title}</h1>
        <p className="text-blue-200 text-sm mt-1 flex items-center gap-1">📍 {assignment.job_address}</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Description */}
        {assignment.job_description && (
          <div className="card">
            <p className="text-gray-600 text-sm">{assignment.job_description}</p>
          </div>
        )}

        {/* GPS Check-in */}
        <div className="card space-y-3">
          <h3 className="font-bold text-[#0B2265] font-heading">Παρουσίαση GPS</h3>

          {latestCheckin && (
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
              ✅ Τελευταία:{" "}
              {latestCheckin.checkin_type === "start" ? "Άφιξη" :
               latestCheckin.checkin_type === "end" ? "Αποχώρηση" :
               latestCheckin.checkin_type === "break_start" ? "Διάλειμμα" : "Επιστροφή"}{" "}
              — {new Date(latestCheckin.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "start", label: "Άφιξη" },
              { value: "break_start", label: "Διάλειμμα" },
              { value: "break_end", label: "Επιστροφή" },
              { value: "end", label: "Αποχώρηση" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCheckinType(opt.value)}
                className={`py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  checkinType === opt.value
                    ? "bg-[#0B2265] border-[#0B2265] text-white"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCheckin}
            disabled={checkingIn}
            className="btn-primary disabled:opacity-50"
          >
            {checkingIn ? "Καταγραφή GPS..." : "📍 Καταγραφή Παρουσίας"}
          </button>
        </div>

        {/* Photo upload */}
        <div className="card space-y-3">
          <h3 className="font-bold text-[#0B2265] font-heading">Φωτογραφίες</h3>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(photoTypeLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPhotoType(value)}
                className={`py-2 px-1 rounded-xl text-xs font-semibold border-2 transition-colors ${
                  photoType === value
                    ? "bg-[#3FAE5A] border-[#3FAE5A] text-white"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Σχόλιο (προαιρετικό)"
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#3FAE5A]"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className={`btn-secondary text-center cursor-pointer block ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploading ? "Ανέβασμα..." : "📸 Τράβηξε Φωτογραφία"}
          </label>

          {/* Photo grid */}
          {assignment.worker_photos && assignment.worker_photos.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{assignment.worker_photos.length} φωτογραφίες</p>
              <div className="grid grid-cols-3 gap-2">
                {assignment.worker_photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs text-center p-1">
                      {photoTypeLabels[photo.photo_type]}
                    </div>
                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                      photo.status === "approved" ? "bg-green-400" :
                      photo.status === "rejected" ? "bg-red-400" : "bg-yellow-400"
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Check-in history */}
        {assignment.worker_checkins && assignment.worker_checkins.length > 0 && (
          <div className="card space-y-2">
            <h3 className="font-bold text-[#0B2265] font-heading text-sm">Ιστορικό παρουσίας</h3>
            {assignment.worker_checkins.map((c) => (
              <div key={c.id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">
                  {c.checkin_type === "start" ? "✅ Άφιξη" :
                   c.checkin_type === "end" ? "🚪 Αποχώρηση" :
                   c.checkin_type === "break_start" ? "☕ Διάλειμμα" : "🔄 Επιστροφή"}
                </span>
                <span className="text-gray-400">
                  {new Date(c.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
