"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

interface Assignment {
  id: string;
  job_title: string;
  job_address: string;
  job_description: string | null;
  assigned_date: string;
  start_time: string | null;
  notes: string | null;
}

interface Checkin {
  id: string;
  checkin_type: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface Photo {
  id: string;
  s3_key: string;
  photo_type: string;
  caption: string | null;
  status: string;
  created_at: string;
}

interface Material {
  id: string;
  material_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  created_at: string;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? m[2] : null;
}

const checkinLabels: Record<string, string> = {
  start: "Έναρξη εργασίας",
  end: "Λήξη εργασίας",
  break_start: "Έναρξη διαλείμματος",
  break_end: "Τέλος διαλείμματος",
};

const photoTypeLabels: Record<string, string> = {
  before: "Πριν", during: "Κατά τη διάρκεια", after: "Μετά",
  material: "Υλικό", issue: "Πρόβλημα",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "Εκκρεμεί", approved: "Εγκρίθηκε", rejected: "Απορρίφθηκε",
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"checkin" | "photos" | "materials">("checkin");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoType, setPhotoType] = useState<string>("during");
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const [matForm, setMatForm] = useState({ material_name: "", quantity: "", unit: "τεμ.", notes: "" });
  const [matSubmitting, setMatSubmitting] = useState(false);
  const [matMsg, setMatMsg] = useState("");

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState("");

  useEffect(() => {
    const token = getCookie("worker_token");
    if (!token) { router.push("/worker/login"); return; }
    fetchAll(token);
  }, [assignmentId, router]);

  const fetchAll = async (token: string) => {
    try {
      const [aRes, cRes, pRes, mRes] = await Promise.all([
        fetch(\`/api/jobs/\${assignmentId}\`, { headers: { "x-worker-token": token } }),
        fetch(\`/api/checkin?assignment_id=\${assignmentId}\`, { headers: { "x-worker-token": token } }),
        fetch(\`/api/photos?assignment_id=\${assignmentId}\`, { headers: { "x-worker-token": token } }),
        fetch(\`/api/materials?assignment_id=\${assignmentId}\`, { headers: { "x-worker-token": token } }),
      ]);
      if (aRes.status === 401) { router.push("/worker/login"); return; }
      const [aData, cData, pData, mData] = await Promise.all([aRes.json(), cRes.json(), pRes.json(), mRes.json()]);
      setAssignment(aData.assignment || null);
      setCheckins(cData.checkins || []);
      setPhotos(pData.photos || []);
      setMaterials(mData.materials || []);
    } catch { } finally { setLoading(false); }
  };

  const handleCheckin = async (type: string) => {
    const token = getCookie("worker_token")!;
    setCheckingIn(true); setCheckinMsg("");
    const doCheckin = async (lat: number | null, lng: number | null, acc: number | null) => {
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-worker-token": token },
          body: JSON.stringify({ assignment_id: assignmentId, checkin_type: type, latitude: lat, longitude: lng, accuracy_meters: acc }),
        });
        const data = await res.json();
        if (res.ok) { setCheckinMsg(data.message || "Καταγράφηκε"); fetchAll(token); }
        else { setCheckinMsg(data.error || "Σφάλμα"); }
      } finally { setCheckingIn(false); setTimeout(() => setCheckinMsg(""), 3000); }
    };
    if (!navigator.geolocation) { await doCheckin(null, null, null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => doCheckin(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => doCheckin(null, null, null),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getCookie("worker_token")!;
    setUploading(true); setUploadMsg("");
    try {
      const initRes = await fetch("/api/photos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({ assignment_id: assignmentId, photo_type: photoType, caption: photoCaption || null, filename: file.name, content_type: file.type || "image/jpeg" }),
      });
      if (!initRes.ok) { const err = await initRes.json(); setUploadMsg(err.error || "Σφάλμα προετοιμασίας"); return; }
      const { upload_url } = await initRes.json();
      const s3Res = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });
      if (!s3Res.ok) { setUploadMsg("Σφάλμα ανεβάσματος στο S3"); return; }
      setUploadMsg("Η φωτογραφία ανέβηκε επιτυχώς ✓");
      setPhotoCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchAll(token);
    } catch { setUploadMsg("Σφάλμα δικτύου"); }
    finally { setUploading(false); setTimeout(() => setUploadMsg(""), 4000); }
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matForm.material_name || !matForm.quantity) { setMatMsg("Συμπληρώστε τα υποχρεωτικά πεδία"); return; }
    const token = getCookie("worker_token")!;
    setMatSubmitting(true); setMatMsg("");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-worker-token": token },
        body: JSON.stringify({ assignment_id: assignmentId, material_name: matForm.material_name, quantity: parseFloat(matForm.quantity), unit: matForm.unit, notes: matForm.notes || null }),
      });
      if (res.ok) { setMatMsg("Υλικό καταχωρήθηκε ✓"); setMatForm({ material_name: "", quantity: "", unit: "τεμ.", notes: "" }); fetchAll(token); }
      else { const err = await res.json(); setMatMsg(err.error || "Σφάλμα καταχώρησης"); }
    } finally { setMatSubmitting(false); setTimeout(() => setMatMsg(""), 3000); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B2265] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!assignment) return (
    <div className="min-h-screen bg-[#F4F6F7] flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-gray-500">Η ανάθεση δεν βρέθηκε</p>
      <button onClick={() => router.push("/worker/dashboard")} className="btn-primary">← Πίσω</button>
    </div>
  );

  const isStarted = checkins.some((c) => c.checkin_type === "start");
  const isEnded = checkins.some((c) => c.checkin_type === "end");

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <div className="bg-[#0B2265] px-5 pt-12 pb-5 safe-top">
        <button onClick={() => router.push("/worker/dashboard")} className="text-blue-200 text-sm mb-3 flex items-center gap-1">← Πίσω</button>
        <h1 className="text-white text-xl font-bold font-heading leading-tight">{assignment.job_title}</h1>
        <p className="text-blue-300 text-sm mt-1">📍 {assignment.job_address}</p>
        {assignment.start_time && <p className="text-blue-300 text-sm mt-0.5">🕐 {assignment.start_time.slice(0, 5)}</p>}
      </div>

      <div className="bg-white border-b border-gray-100 flex">
        {(["checkin", "photos", "materials"] as const).map((t) => {
          const labels = { checkin: "Check-in", photos: \`Φωτ. (\${photos.length})\`, materials: \`Υλικά (\${materials.length})\` };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={\`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors \${tab === t ? "border-[#3FAE5A] text-[#0B2265]" : "border-transparent text-gray-400"}\`}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-5">
        {tab === "checkin" && (
          <div className="space-y-4">
            {assignment.job_description && <div className="card"><p className="text-sm font-semibold text-gray-500 mb-1">Περιγραφή</p><p className="text-gray-700 text-sm">{assignment.job_description}</p></div>}
            {assignment.notes && <div className="card bg-amber-50"><p className="text-amber-700 text-sm">📝 {assignment.notes}</p></div>}
            <div className="card space-y-3">
              <h3 className="font-bold text-[#0B2265] font-heading">Καταγραφή παρουσίας</h3>
              {checkinMsg && <p className={\`text-sm text-center py-2 rounded-lg \${checkinMsg.includes("Σφάλμα") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}\`}>{checkinMsg}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleCheckin("start")} disabled={checkingIn || isStarted} className="bg-[#3FAE5A] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm">✅ Έναρξη</button>
                <button onClick={() => handleCheckin("end")} disabled={checkingIn || !isStarted || isEnded} className="bg-[#0B2265] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm">🏁 Λήξη</button>
                <button onClick={() => handleCheckin("break_start")} disabled={checkingIn || !isStarted || isEnded} className="bg-amber-400 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm">☕ Διάλειμμα</button>
                <button onClick={() => handleCheckin("break_end")} disabled={checkingIn || !isStarted || isEnded} className="bg-gray-400 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm">▶️ Επιστροφή</button>
              </div>
              {checkingIn && <p className="text-center text-sm text-gray-400 animate-pulse">Λήψη GPS...</p>}
            </div>
            {checkins.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-[#0B2265] font-heading mb-3">Ιστορικό</h3>
                <div className="space-y-2">
                  {checkins.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{checkinLabels[c.checkin_type] || c.checkin_type}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(c.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
                        {c.latitude && <span className="ml-1 text-green-500">📍</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "photos" && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <h3 className="font-bold text-[#0B2265] font-heading">Ανέβασμα φωτογραφίας</h3>
              <div>
                <label className="text-gray-500 text-xs block mb-1">Τύπος</label>
                <select value={photoType} onChange={(e) => setPhotoType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                  {Object.entries(photoTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">Σχόλιο (προαιρετικό)</label>
                <input type="text" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="π.χ. Κατεστραμμένο πλακίδιο..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              {uploadMsg && <p className={\`text-sm text-center py-2 rounded-lg \${uploadMsg.includes("Σφάλμα") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}\`}>{uploadMsg}</p>}
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="w-full bg-[#0B2265] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ανέβασμα...</> : <>📷 Επιλογή / Κάμερα</>}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
            </div>
            {photos.length > 0 ? (
              <div className="card">
                <h3 className="font-bold text-[#0B2265] font-heading mb-3">Φωτογραφίες ({photos.length})</h3>
                <div className="space-y-2">
                  {photos.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-500">{photoTypeLabels[p.photo_type] || p.photo_type}</span>
                          <span className={\`text-xs px-2 py-0.5 rounded-full font-semibold \${statusColors[p.status] || "bg-gray-100 text-gray-500"}\`}>{statusLabels[p.status] || p.status}</span>
                        </div>
                        {p.caption && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.caption}</p>}
                        <p className="text-xs text-gray-300 mt-0.5">{new Date(p.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-2xl">📸</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center py-10 text-gray-400"><p className="text-3xl mb-2">📷</p><p>Δεν υπάρχουν φωτογραφίες ακόμα</p></div>
            )}
          </div>
        )}

        {tab === "materials" && (
          <div className="space-y-4">
            <form onSubmit={handleMaterialSubmit} className="card space-y-3">
              <h3 className="font-bold text-[#0B2265] font-heading">Αίτηση υλικών</h3>
              <div>
                <label className="text-gray-500 text-xs block mb-1">Υλικό *</label>
                <input type="text" value={matForm.material_name} onChange={(e) => setMatForm((f) => ({ ...f, material_name: e.target.value }))} placeholder="π.χ. Τσιμέντο, Πλακίδια..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" required />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-gray-500 text-xs block mb-1">Ποσότητα *</label>
                  <input type="number" value={matForm.quantity} onChange={(e) => setMatForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="0" min="0.01" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" required />
                </div>
                <div className="w-28">
                  <label className="text-gray-500 text-xs block mb-1">Μονάδα</label>
                  <select value={matForm.unit} onChange={(e) => setMatForm((f) => ({ ...f, unit: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {["τεμ.", "m²", "m³", "m", "kg", "lt", "σάκος", "κιβώτιο"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs block mb-1">Σημειώσεις</label>
                <input type="text" value={matForm.notes} onChange={(e) => setMatForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Προαιρετικές σημειώσεις..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              {matMsg && <p className={\`text-sm text-center py-2 rounded-lg \${matMsg.includes("Σφάλμα") || matMsg.includes("Συμπλ") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}\`}>{matMsg}</p>}
              <button type="submit" disabled={matSubmitting} className="w-full bg-[#3FAE5A] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm">
                {matSubmitting ? "Καταχώρηση..." : "🧱 Καταχώρηση υλικού"}
              </button>
            </form>
            {materials.length > 0 ? (
              <div className="card">
                <h3 className="font-bold text-[#0B2265] font-heading mb-3">Καταχωρημένα ({materials.length})</h3>
                <div className="space-y-2">
                  {materials.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                      <div><p className="font-semibold text-gray-700">{m.material_name}</p>{m.notes && <p className="text-xs text-gray-400">{m.notes}</p>}</div>
                      <span className="font-bold text-[#0B2265] shrink-0 ml-2">{m.quantity} {m.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center py-10 text-gray-400"><p className="text-3xl mb-2">🧱</p><p>Δεν υπάρχουν υλικά ακόμα</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
