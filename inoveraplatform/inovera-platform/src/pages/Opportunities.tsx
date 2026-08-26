import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Internship } from "../lib/types";

export default function Opportunities() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Internship[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("internships")
      .select("*, companies(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    setRows((data as any) ?? []);

    if (profile?.student_id) {
      const { data: apps } = await supabase
        .from("applications")
        .select("internship_id")
        .eq("student_id", profile.student_id);
      setAppliedIds(new Set((apps ?? []).map((a: any) => a.internship_id)));
    }
    setLoading(false);
  }

  async function apply(internshipId: string) {
    if (!profile?.student_id) {
      alert("حسابك مش مربوط بملف طالب — كلم المرشد المدرسي.");
      return;
    }
    await supabase.from("applications").insert({ internship_id: internshipId, student_id: profile.student_id });
    load();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#2e2560] mb-1">فرص التدريب المتاحة</h1>
      <p className="text-slate-500 text-sm mb-5">فرص منشورة فعلياً من شركاء حقيقيين على المنصة.</p>

      {loading ? (
        <div className="text-slate-400 text-sm">جارِ التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="text-xs text-slate-400">{r.companies?.name}</div>
              <div className="font-bold text-[#2e2560] mt-1">{r.title}</div>
              <div className="text-sm text-slate-500 mt-1">{r.description}</div>
              <button
                disabled={appliedIds.has(r.id)}
                onClick={() => apply(r.id)}
                className="mt-3 rounded-lg bg-[#5b3df6] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-4 py-2"
              >
                {appliedIds.has(r.id) ? "تم التقديم ✓" : "قدّم الآن"}
              </button>
            </div>
          ))}
          {rows.length === 0 && <div className="text-slate-400 text-sm">مفيش فرص متاحة حالياً.</div>}
        </div>
      )}
    </div>
  );
}
