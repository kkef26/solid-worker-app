"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"phone" | "pin">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Check existing session
  useEffect(() => {
    const token = getCookie("worker_token");
    if (token) {
      const mgr = getCookie("worker_is_manager") === "true";
      router.push(mgr ? "/settings" : "/worker/dashboard");
    }
  }, [router]);

  // Auto-focus phone input
  useEffect(() => {
    if (step === "phone") phoneRef.current?.focus();
  }, [step]);

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
    if (loading || pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      handleLogin(newPin);
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
        setError(data.error || "Λάθος στοιχεία");
        setPin("");
        setLoading(false);
        return;
      }
      // Store in cookies (not localStorage — works with SSR)
      const maxAge = 30 * 24 * 3600;
      document.cookie = `worker_token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `worker_is_manager=${data.is_manager ?? false}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `worker_name=${encodeURIComponent(data.display_name || "")}; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Also localStorage for client-side reads
      localStorage.setItem("worker_token", data.token);
      localStorage.setItem("worker_info", JSON.stringify({
        id: data.worker_id,
        display_name: data.display_name,
        is_manager: data.is_manager,
      }));

      if (data.is_manager) {
        router.push("/settings");
      } else {
        router.push("/worker/dashboard");
      }
    } catch {
      setError("Σφάλμα σύνδεσης. Δοκιμάστε ξανά.");
      setPin("");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (step === "phone" && e.key === "Enter") handlePhoneSubmit();
  };

  const pinPad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div
      className="min-h-screen bg-[#0B2265] flex flex-col items-center justify-between px-6 py-12"
      onKeyDown={handleKeyDown}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-[#3FAE5A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-900/20">
            <span className="text-white font-black text-3xl font-heading">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold font-heading tracking-tight">Solid Workers</h1>
          <p className="text-blue-200/60 text-sm mt-1">Αναδόμηση Τεχνική</p>
        </div>

        {step === "phone" ? (
          <div className="w-full space-y-5">
            <div>
              <label className="text-blue-200 text-sm block mb-2 font-medium">Αριθμός τηλεφώνου</label>
              <input
                ref={phoneRef}
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                placeholder="+30 690 000 0001"
                className="w-full bg-white/10 border-2 border-white/20 text-white placeholder-blue-300/50 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-[#3FAE5A] transition-colors"
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
            {error && <p className="text-red-300 text-sm text-center">{error}</p>}
            <button
              onClick={handlePhoneSubmit}
              className="w-full bg-[#3FAE5A] hover:bg-[#2E9449] active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-lg shadow-green-900/20"
            >
              Συνέχεια
            </button>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="text-center">
              <p className="text-blue-200 text-sm mb-1">Εισάγετε το PIN σας</p>
              <p className="text-white font-semibold text-lg">{phone}</p>
              <button
                onClick={() => { setStep("phone"); setPin(""); setError(""); }}
                className="text-blue-300/70 text-xs mt-2 underline underline-offset-2"
              >
                Αλλαγή αριθμού
              </button>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    i < pin.length
                      ? "bg-[#3FAE5A] scale-125 shadow-lg shadow-green-400/30"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-red-300 text-sm text-center">{error}</p>}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Σύνδεση...
              </div>
            )}

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
                    h-16 rounded-2xl text-2xl font-bold transition-all select-none active:scale-95
                    ${key === ""
                      ? "invisible"
                      : key === "⌫"
                      ? "bg-white/5 hover:bg-white/10 text-white/60 text-xl"
                      : "bg-white/10 hover:bg-white/15 active:bg-[#3FAE5A] text-white"
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

      <p className="text-blue-300/30 text-xs text-center mt-8">
        Solid Anadomisi Tech © 2026
      </p>
    </div>
  );
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}
