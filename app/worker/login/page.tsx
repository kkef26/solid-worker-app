"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"phone" | "pin">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned || cleaned.length < 10) {
      setError("Εισάγετε έγκυρο αριθμό τηλεφώνου");
      return;
    }
    setError("");
    setStep("pin");
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  const handleLogin = async (pinValue: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone.replace(/\s/g, ""), pin: pinValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Σφάλμα σύνδεσης");
        setPin("");
        setLoading(false);
        return;
      }
      // Store token in cookie via response header (set by server)
      document.cookie = `worker_token=${data.token}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
      document.cookie = `worker_is_manager=${data.is_manager}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
      if (data.is_manager) {
        router.push("/overview");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Σφάλμα σύνδεσης. Δοκιμάστε ξανά.");
      setPin("");
      setLoading(false);
    }
  };

  const pinPad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="min-h-screen bg-[#0B2265] flex flex-col items-center justify-between px-6 py-12 safe-top safe-bottom">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-[#3FAE5A] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-3xl font-heading">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold font-heading">Solid Workers</h1>
          <p className="text-blue-200 text-sm mt-1">Αναδόμηση Τεχνική</p>
        </div>

        {step === "phone" ? (
          <div className="w-full max-w-xs space-y-4">
            <div>
              <label className="text-blue-200 text-sm block mb-2">Αριθμός τηλεφώνου</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                placeholder="+30 690 000 0001"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#3FAE5A] transition-colors"
                autoComplete="tel"
                autoFocus
              />
            </div>
            {error && <p className="text-red-300 text-sm text-center">{error}</p>}
            <button
              onClick={handlePhoneSubmit}
              className="w-full bg-[#3FAE5A] hover:bg-[#2E9449] text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              Συνέχεια →
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs space-y-6">
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-1">PIN για</p>
              <p className="text-white font-semibold">{phone}</p>
              <button
                onClick={() => { setStep("phone"); setPin(""); setError(""); }}
                className="text-blue-300 text-xs mt-1 underline"
              >
                Αλλαγή αριθμού
              </button>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all ${
                    i < pin.length ? "bg-[#3FAE5A] scale-110" : "bg-white/20"
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-red-300 text-sm text-center">{error}</p>}
            {loading && <p className="text-blue-200 text-sm text-center">Σύνδεση...</p>}

            {/* PIN pad */}
            <div className="grid grid-cols-3 gap-3">
              {pinPad.map((key, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (key === "⌫") handlePinDelete();
                    else if (key !== "") handlePinDigit(key);
                  }}
                  disabled={loading || key === ""}
                  className={`
                    h-16 rounded-2xl text-2xl font-bold transition-all select-none
                    ${key === ""
                      ? "invisible"
                      : key === "⌫"
                      ? "bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xl"
                      : "bg-white/10 hover:bg-white/20 active:bg-[#3FAE5A] text-white border border-white/10"
                    }
                  `}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-blue-300/50 text-xs text-center">
        Solid Anadomisi Tech © 2026
      </p>
    </div>
  );
}
