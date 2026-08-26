import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { TalentPoolRow } from "../../lib/types";

export default function Talent() {
  const [rows, setRows] = useState<TalentPoolRow[]>([]);
  const [minReadiness, setMinReadiness] = useState(0);
  const [major, setMajor] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("talent_pool")
      .select("*")
      .order("overall_readiness", { ascending: false });
    if (!error) setRows((data as TalentPoolRow[]) ?? []);
    setLoading(false);
  }

  const filtered = rows.filter(
    (r) => (r.overall_readiness ?? 0) >= minReadiness && (major === "" || (r.major ?? "").includes(major))
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#2e2560] mb-1">تصفح الطلاب الجاهزين</h1>
      <p className="text-slate-500 text-sm mb-5">
        بيانات مجهّلة عن الهوية (من غير أرقام قومية أو أرقام تليفون) — {filtered.length} طالب مطابق.
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-sm flex items-center gap-2">
          <span className="text-slate-500">حد أدنى للجاهزية:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={minReadiness}
            onChange={(e) => setMinReadiness(Number(e.target.value))}
          />
          <span className="font-semibold text-[#5b3df6]">{minReadiness}%</span>
        </div>
        <input
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          placeholder="فلترة بالتخصص..."
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">جارِ التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.student_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#5b3df6]" dir="ltr">
                  {r.code}
                </span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {r.overall_readiness ?? "—"}% جاهزية
                </span>
              </div>
              <div className="text-sm font-semibold">{r.major}</div>
              <div className="text-xs text-slate-500 mt-1">
                {r.school_name} · {r.grade} · {r.governorate}
              </div>
              <div className="text-xs text-slate-400 mt-2">حضور آخر 90 يوم: {r.attendance_rate_90d ?? "—"}%</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-slate-400 text-sm">لا يوجد طلاب مطابقين للفلتر.</div>}
        </div>
      )}
    </div>
  );
}
