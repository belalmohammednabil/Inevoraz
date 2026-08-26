import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import RoleGuard from "../components/RoleGuard";
import { useAuth } from "../context/AuthContext";

interface Row {
  id: string;
  risk_level: string;
  priority: string;
  reason: string | null;
  status: string;
  responsible_person: string | null;
  students: { full_name: string; code: string } | null;
}

interface StudentOption {
  id: string;
  code: string;
  full_name: string;
}

function InterventionsInner() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    risk_level: "متوسط",
    priority: "عادية",
    reason: "",
    responsible_person: profile?.full_name ?? "",
  });

  useEffect(() => {
    load();
    supabase
      .from("students")
      .select("id, code, full_name")
      .order("code")
      .then(({ data }) => setStudents((data as any) ?? []));
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("interventions")
      .select("id, risk_level, priority, reason, status, responsible_person, students(full_name, code)")
      .order("created_at", { ascending: false });
    if (!error) setRows((data as any) ?? []);
    setLoading(false);
  }

  async function createIntervention(e: React.FormEvent) {
    e.preventDefault();
    if (!form.student_id) return;
    await supabase.from("interventions").insert({
      student_id: form.student_id,
      risk_level: form.risk_level,
      priority: form.priority,
      reason: form.reason,
      responsible_person: form.responsible_person,
      created_by: profile?.id,
    });
    setShowForm(false);
    setForm({ ...form, reason: "" });
    load();
  }

  async function toggleStatus(id: string, current: string) {
    await supabase
      .from("interventions")
      .update({ status: current === "مفتوح" ? "مغلق" : "مفتوح" })
      .eq("id", id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2e2560]">سجل التدخلات والمخاطر الإرشادية</h1>
          <p className="text-slate-500 text-sm mt-1">{rows.length} حالة مسجّلة — بيانات حقيقية قابلة للتعديل فوراً.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-[#5b3df6] hover:bg-[#4c30e0] text-white text-sm font-semibold px-4 py-2"
        >
          + تسجيل حالة جديدة
        </button>
      </div>

      {showForm && (
        <form onSubmit={createIntervention} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              required
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">اختر الطالب...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.full_name}
                </option>
              ))}
            </select>
            <select
              value={form.risk_level}
              onChange={(e) => setForm({ ...form, risk_level: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="منخفض">مستوى الخطورة: منخفض</option>
              <option value="متوسط">مستوى الخطورة: متوسط</option>
              <option value="مرتفع">مستوى الخطورة: مرتفع</option>
            </select>
          </div>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="سبب الخطورة / ملاحظات"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button className="rounded-lg bg-[#2e2560] text-white text-sm font-semibold px-4 py-2">حفظ الحالة</button>
        </form>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">جارِ التحميل...</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {r.students?.full_name} <span className="text-slate-400 font-mono text-xs" dir="ltr">({r.students?.code})</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{r.reason}</div>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${riskColor(r.risk_level)}`}>{r.risk_level}</span>
                  {r.priority === "عاجلة" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">عاجلة</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleStatus(r.id, r.status)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                  r.status === "مفتوح" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {r.status}
              </button>
            </div>
          ))}
          {rows.length === 0 && <div className="text-slate-400 text-sm">لا توجد حالات مسجّلة بعد.</div>}
        </div>
      )}
    </div>
  );
}

function riskColor(level: string) {
  if (level === "مرتفع") return "bg-red-100 text-red-700";
  if (level === "متوسط") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function Interventions() {
  return (
    <RoleGuard allow={["admin", "counselor"]}>
      <InterventionsInner />
    </RoleGuard>
  );
}
