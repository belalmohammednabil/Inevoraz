import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import RoleGuard from "../components/RoleGuard";

interface Row {
  id: string;
  code: string;
  full_name: string;
  grade: string | null;
  major: string | null;
  governorate: string | null;
  schools: { name: string } | null;
  career_profile: { overall_readiness: number | null }[] | null;
}

function DirectoryInner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("id, code, full_name, grade, major, governorate, schools(name), career_profile(overall_readiness)")
      .order("code");
    if (!error) setRows((data as any) ?? []);
    setLoading(false);
  }

  const filtered = rows.filter(
    (r) =>
      r.full_name.includes(search) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.major ?? "").includes(search)
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#2e2560] mb-1">دليل الطلاب</h1>
      <p className="text-slate-500 text-sm mb-5">قائمة حية من قاعدة البيانات — {rows.length} طالب مسجل.</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث بالاسم، الكود، أو التخصص..."
        className="w-full max-w-md mb-5 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b3df6]"
      />

      {loading ? (
        <div className="text-slate-400 text-sm">جارِ التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#5b3df6] text-white text-right">
                <th className="p-3">الكود</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">المدرسة</th>
                <th className="p-3">الصف / التخصص</th>
                <th className="p-3">المحافظة</th>
                <th className="p-3">الجاهزية</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-[#f7f6fd]" : ""}>
                  <td className="p-3 font-mono text-[#5b3df6]" dir="ltr">
                    {r.code}
                  </td>
                  <td className="p-3 font-medium">{r.full_name}</td>
                  <td className="p-3">{r.schools?.name ?? "—"}</td>
                  <td className="p-3">
                    {r.grade} / {r.major}
                  </td>
                  <td className="p-3">{r.governorate}</td>
                  <td className="p-3">
                    {r.career_profile?.[0]?.overall_readiness != null
                      ? `${r.career_profile[0].overall_readiness}%`
                      : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function StudentDirectory() {
  return (
    <RoleGuard allow={["admin", "counselor", "teacher"]}>
      <DirectoryInner />
    </RoleGuard>
  );
}
