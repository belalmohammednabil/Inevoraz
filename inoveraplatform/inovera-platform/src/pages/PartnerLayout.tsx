import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import RoleGuard from "../components/RoleGuard";
import type { Company } from "../lib/types";

function PartnerLayoutInner() {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    load();
  }, [profile]);

  async function load() {
    const { data } = await supabase.from("companies").select("*").eq("owner_id", profile!.id).maybeSingle();
    setCompany(data as Company | null);
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await supabase.from("companies").insert({ owner_id: profile!.id, name, industry });
    setCreating(false);
    load();
  }

  if (company === undefined) return <div className="p-8 text-slate-400">جارِ التحميل...</div>;

  if (company === null) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-xl font-extrabold text-[#2e2560] mb-1">أنشئ ملف شركتك</h1>
        <p className="text-slate-500 text-sm mb-5">خطوة واحدة بس عشان تبدأ تتصفح الطلاب وتنشر فرص تدريب.</p>
        <form onSubmit={createCompany} className="space-y-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-sm">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الشركة"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="المجال (اتصالات، بنوك، تكنولوجيا...)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button disabled={creating} className="w-full rounded-lg bg-[#5b3df6] text-white font-semibold py-2.5">
            {creating ? "..." : "إنشاء"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between">
        <div>
          <div className="font-extrabold text-[#2e2560]">{company.name}</div>
          <div className="text-xs text-slate-400">
            خطة: {company.plan === "featured" ? "مميزة ✨" : company.plan === "pro" ? "احترافية" : "مجانية"}
          </div>
        </div>
        <nav className="flex gap-2 text-sm">
          <NavLink
            to="/partner"
            end
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-medium ${isActive ? "bg-[#5b3df6] text-white" : "text-slate-500 hover:bg-slate-100"}`
            }
          >
            تصفح الطلاب
          </NavLink>
          <NavLink
            to="/partner/internships"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-medium ${isActive ? "bg-[#5b3df6] text-white" : "text-slate-500 hover:bg-slate-100"}`
            }
          >
            فرص التدريب
          </NavLink>
          <NavLink
            to="/partner/applications"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-medium ${isActive ? "bg-[#5b3df6] text-white" : "text-slate-500 hover:bg-slate-100"}`
            }
          >
            المتقدمون
          </NavLink>
        </nav>
      </div>
      <Outlet context={{ company }} />
    </div>
  );
}

export default function PartnerLayout() {
  return (
    <RoleGuard allow={["company", "admin"]}>
      <PartnerLayoutInner />
    </RoleGuard>
  );
}
