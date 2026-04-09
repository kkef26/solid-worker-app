"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

interface Assignment {
  id: string;
  job_title: string;
  job_address: string;
  job_description: string | null;
  start_time: string | null;
  notes: string | null;
}

interface Checkin {
  id: string;
  checkin_type: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

interface Photo {
  id: string;
  photo_type: string;
  caption: string | null;
  status: string;
  created_at: string;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

const checkinLabels: Record<string, string> = {
  start: "Έναρξη", end: "Λήξη",
  break_start: "Διάλειμμα", break_end: "Επιστροφή",
};

const photoTypeLabels: Record<string, string> = {
  before: "Πριν", during: "Κατά τη διάρκεια", after: "Μετά",
  material: "Υλικό", issue: "Πρόβλημα",
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [showMaterial, setShowMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState({ name: "", quantity: "", unit: "kg" });
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [materialSaved, setMaterialSaved] = useState(false);

  const [selectedPhotoType, setSelectedPhotoType] = useState("during");
  const [photoCaption, setPhotoCaption] = useState("");

  const token = getCookie("worker_token");

  useEffect(() => {
    if (!token) { router.push("/worker/login"); return; }
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobRes, checkinsRes, photosRes] = await Promise.all([
        fetch(`/api/jobs/${assignmentId}`, { headers: { "x-worker-token": token! } }),
        fetch(`/api/checkin?assignment_id=${assignmentId}`, { headers: { "x-worker-token": token! } }),
        fetch(`/api/photos?assignment_id=${assignmentId}`, { headers: { "x-worker-token": token! } }),
      ]);
      if (jobRes.ok) setAssignment((await jobRes.json()).assignment);
      if (checkinsRes.ok) setCheckins((await checkinsRes.json()).checkins || []);
      if (photosRes.ok) setPhotos((await photosRes.json()).photos || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (type: string) => {
    setCheckingIn(true);
    const doCheckin = async (lat: number | null, lng: number | null, acc: number | null) => {
      try {
        await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-worker-token": token! },
          body: JSON.stringify({
            assignment_id: assignmentId,
            checkin_type: type,
            latitude: lat,
            longitude: lng,
            accuracy_meters: acc,
          }),
        });
        await fetchData();
      } finally {
        setCheckingIn(false);
      }
    };
    if (!navigator.geolocation) { await doCheckin(null, null, null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => doCheckin(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => doCheckin(null, null, null),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await fetch("/api/photos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token! },
        body: JSON.stringify({
          assignment_id: assignmentId,
          photo_type: selectedPhotoType,
          caption: photoCaption || null,
          filename: file.name,
          content_type: file.type,
        }),
      });
      if (!res.ok) return;
      const { upload_url } = await res.json();
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      setPhotoCaption("");
      await fetchData();
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMaterialSave = async () => {
    if (!materialForm.name || !materialForm.quantity) return;
    setSavingMaterial(true);
    try {
      await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token! },
        body: JSON.stringify({
          assignment_id: assignmentId,
          material_name: materialForm.name,
          quantity: parseFloat(materialForm.quantity),
          unit: materialForm.unit,
        }),
      });
      setMaterialForm({ name: "", quantity: "", unit: "kg" });
      setShowMaterial(false);
      setMaterialSaved(true);
      setTimeout(() => setMaterialSaved(false), 2000);
    } finally {
      setSavingMaterial(false);
    }
  };

  const lastCheckin = checkins[checkins.length - 1];
  const isWorking = lastCheckin?.checkin_type === "start" || lastCheckin?.checkin_type === "break_end";
  const isOnBreak = lastCheckin?.checkin_type === "break_start";
  const hasStarted = checkins.some(c => c.checkin_type === "start");
  const hasEnded = checkins.some(c => c.checkin_type === "end");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2265] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-[#F4F6F7] flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 text-center mb-4">Η εργασία δεν βρέθηκε</p>
        <button onClick={() => router.back()} className="btn-primary max-w-xs">← Πίσω</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      {/* Header */}
      <div className="bg-[#0B2265] px-5 pt-12 pb-5">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-3">← Πίσω</button>
        <h1 className="text-white text-xl font-bold font-heading leading-tight">
          {assignment.job_title}
        </h1>
        <p className="text-blue-200 text-sm mt-1">📍 {assignment.job_address}</p>
        {assignment.start_time && (
          <span className="inline-block mt-2 text-xs bg-white/10 text-white px-2 py-1 rounded-lg">
            ⏰ {assignment.start_time.slice(0, 5)}
          </span>
        )}
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Description */}
        {assignment.job_description && (
          <div className="card">
            <p className="text-sm font-semibold text-[#0B2265] mb-1">Περιγραφή</p>
            <p className="text-gray-600 text-sm">{assignment.job_description}</p>
          </div>
        )}

        {/* Notes */}
        {assignment.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-amber-700 text-sm">📝 {assignment.notes}</p>
          </div>
        )}

        {/* Check-in section */}
        <div className="card">
          <p className="text-sm font-semibold text-[#0B2265] mb-3">Παρουσία</p>

          {!hasStarted ? (
            <button
              onClick={() => handleCheckin("start")}
              disabled={checkingIn}
              className="w-full bg-[#3FAE5A] hover:bg-[#2E9449] text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50"
            >
              {checkingIn ? "Καταγραφή..." : "✅ ΕΝΑΡΞΗ ΕΡΓΑΣΙΑΣ"}
            </button>
          ) : hasEnded ? (
            <div className="text-center py-3">
              <span className="text-3xl">🏁</span>
              <p className="text-green-600 font-semibold mt-2">Εργασία Ολοκληρώθηκε</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`text-center py-2 rounded-xl text-sm font-semibold ${
                isWorking ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}>
                {isWorking ? "🟢 Σε εργασία" : "🟡 Σε διάλειμμα"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {isWorking && (
                  <button
                    onClick={() => handleCheckin("break_start")}
                    disabled={checkingIn}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    ☕ Διάλειμμα
                  </button>
                )}
                {isOnBreak && (
                  <button
                    onClick={() => handleCheckin("break_end")}
                    disabled={checkingIn}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    ↩️ Επιστροφή
                  </button>
                )}
                <button
                  onClick={() => handleCheckin("end")}
                  disabled={checkingIn || isOnBreak}
                  className={`bg-[#0B2265] hover:bg-[#0a1d58] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 ${isWorking && !isOnBreak ? "" : "col-span-2"}`}
                >
                  🏁 Λήξη Εργασίας
                </button>
              </div>
            </div>
          )}

          {/* Check-in log */}
          {checkins.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
              {checkins.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{checkinLabels[c.checkin_type] || c.checkin_type}</span>
                  <span className="text-gray-400">
                    {new Date(c.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                    {c.latitude ? " 📍" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photos section */}
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-[#0B2265]">Φωτογραφίες ({photos.length})</p>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(photoTypeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedPhotoType(key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  selectedPhotoType === key
                    ? "bg-[#0B2265] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={photoCaption}
            onChange={e => setPhotoCaption(e.target.value)}
            placeholder="Λεζάντα (προαιρετικό)..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3FAE5A]"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="w-full bg-[#3FAE5A] hover:bg-[#2E9449] text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {uploadingPhoto ? "Αποστολή..." : "📸 Λήψη Φωτογραφίας"}
          </button>

          {photos.length > 0 && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              {photos.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "approved" ? "bg-green-100 text-green-700" :
                    p.status === "rejected" ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {p.status === "approved" ? "✅" : p.status === "rejected" ? "❌" : "⏳"}
                  </span>
                  <span className="text-gray-600">{photoTypeLabels[p.photo_type]}</span>
                  {p.caption && <span className="text-gray-400 truncate flex-1">{p.caption}</span>}
                  <span className="text-gray-400 ml-auto shrink-0">
                    {new Date(p.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Materials section */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0B2265]">Υλικά</p>
            <button
              onClick={() => setShowMaterial(!showMaterial)}
              className="text-xs bg-[#0B2265] text-white px-3 py-1.5 rounded-lg font-semibold"
            >
              + Καταγραφή
            </button>
          </div>

          {materialSaved && (
            <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-xl">
              ✅ Υλικό καταγράφηκε
            </div>
          )}

          {showMaterial && (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <input
                type="text"
                value={materialForm.name}
                onChange={e => setMaterialForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Όνομα υλικού *"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3FAE5A]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={materialForm.quantity}
                  onChange={e => setMaterialForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="Ποσότητα *"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3FAE5A]"
                />
                <select
                  value={materialForm.unit}
                  onChange={e => setMaterialForm(f => ({ ...f, unit: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#3FAE5A]"
                >
                  <option value="kg">kg</option>
                  <option value="τεμ.">τεμ.</option>
                  <option value="m">m</option>
                  <option value="m²">m²</option>
                  <option value="λίτρα">λίτρα</option>
                  <option value="σακιά">σακιά</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowMaterial(false)}
                  className="border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={handleMaterialSave}
                  disabled={savingMaterial || !materialForm.name || !materialForm.quantity}
                  className="bg-[#3FAE5A] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50"
                >
                  {savingMaterial ? "..." : "✓ Αποθήκευση"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
