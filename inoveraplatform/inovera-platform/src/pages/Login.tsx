import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabaseConfigured } from "../lib/supabase";
import type { AppRole } from "../lib/types";

const ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "مدير نظام (Admin)" },
  { value: "counselor", label: "مرشد طلابي (Counselor)" },
  { value: "teacher", label: "معلم (Teacher)" },
  { value: "student", label: "طالب (Student)" },
  { value: "company", label: "شريك صناعي (Company)" },
];

export default function Login() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("admin");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password, fullName, role);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f5fb] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="text-2xl font-extrabold text-[#5b3df6]">INOVERA</div>
          <div className="text-sm text-slate-500 mt-1">نظام إدارة وتطوير الطلاب والمؤشرات</div>
        </div>

        {!supabaseConfigured && (
          <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 leading-relaxed">
            لسه معملتش ربط بـ Supabase. أنشئ مشروع مجاني على supabase.com، شغّل ملف
            supabase/migrations/0001_init.sql، وحط الـ URL والمفتاح في ملف .env (شوف .env.example).
          </div>
        )}

        <div className="flex mb-6 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            className={`flex-1 py-2 rounded-md ${mode === "signin" ? "bg-white shadow text-[#2e2560]" : "text-slate-500"}`}
            onClick={() => setMode("signin")}
          >
            تسجيل الدخول
          </button>
          <button
            className={`flex-1 py-2 rounded-md ${mode === "signup" ? "bg-white shadow text-[#2e2560]" : "text-slate-500"}`}
            onClick={() => setMode("signup")}
          >
            حساب جديد (تجربة)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {mode === "signup" && (
            <div>
              <label className="block mb-1 text-slate-600 font-medium">الاسم بالكامل</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5b3df6]"
              />
            </div>
          )}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5b3df6]"
              placeholder="example@school.edu"
              dir="ltr"
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="block mb-1 text-slate-600 font-medium">الدور</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AppRole)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5b3df6]"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">كلمة المرور</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5b3df6]"
              dir="ltr"
            />
          </div>

          {error && <div className="text-red-600 text-xs">{error}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#5b3df6] hover:bg-[#4c30e0] text-white font-semibold py-2.5 disabled:opacity-50"
          >
            {busy ? "..." : mode === "signin" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>
      </div>
    </div>
  );
}
