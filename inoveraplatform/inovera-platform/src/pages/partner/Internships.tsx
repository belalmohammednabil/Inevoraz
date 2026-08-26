import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Company, Internship } from "../../lib/types";

export default function Internships() {
  const { company } = useOutletContext<{ company: Company }>();
  const [rows, setRows] = useState<Internship[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", specialization: "", spots_available: 1 });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("internships")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    setRows((data as Internship[]) ?? []);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("internships").insert({ ...form, company_id: company.id });
    setShowForm(false);
    setForm({ title: "", description: "", specialization: "", spots_available: 1 });
    load();
  }

  async function toggleStatus(id: string, status: string) {
    await supabase.from("internships").update({ status: status === "open" ? "closed" : "open" }).eq("id", id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold text-[#2e2560]">فرص التدريب المنشورة</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-[#5b3df6] hover:bg-[#4c30e0] text-white text-sm font-semibold px-4 py-2"
        >
          + نشر فرصة جديدة
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 space-y-3 text-sm">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="عنوان الفرصة (مثال: متدرب تطوير برمجيات)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            placeholder="التخصص المطلوب"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="وصف الفرصة"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="number"
            min={1}
            value={form.spots_available}
            onChange={(e) => setForm({ ...form, spots_available: Number(e.target.value) })}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2"
          />
          <button className="rounded-lg bg-[#2e2560] text-white text-sm font-semibold px-4 py-2">نشر</button>
        </form>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-xs text-slate-500">
                {r.specialization} · {r.spots_available} مكان متاح
              </div>
            </div>
            <button
              onClick={() => toggleStatus(r.id, r.status)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                r.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {r.status === "open" ? "مفتوحة" : "مغلقة"}
            </button>
          </div>
        ))}
        {rows.length === 0 && <div className="text-slate-400 text-sm">لسه معملتش نشر أي فرصة تدريب.</div>}
      </div>
    </div>
  );
}
