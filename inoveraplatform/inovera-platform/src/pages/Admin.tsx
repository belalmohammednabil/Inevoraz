import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import RoleGuard from "../components/RoleGuard";

function AdminInner() {
  const [counts, setCounts] = useState<{ profiles: number; companies: number; schools: number } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("companies").select("id", { count: "exact", head: true }),
      supabase.from("schools").select("id", { count: "exact", head: true }),
    ]).then(([p, c, s]) => {
      setCounts({ profiles: p.count ?? 0, companies: c.count ?? 0, schools: s.count ?? 0 });
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#2e2560] mb-1">لوحة المشرف</h1>
      <p className="text-slate-500 text-sm mb-5">إعدادات النظام الأساسية.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-sm text-slate-500">المستخدمين المسجلين</div>
          <div className="text-3xl font-extrabold text-[#5b3df6] mt-1">{counts?.profiles ?? "—"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-sm text-slate-500">الشركاء الصناعيين</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{counts?.companies ?? "—"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-sm text-slate-500">المدارس</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">{counts?.schools ?? "—"}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-sm text-slate-600 leading-relaxed">
        اتصال قاعدة البيانات، سياسات الأمان (RLS)، ومفاتيح الربط كلها بتتضبط من لوحة تحكم مشروع Supabase بتاعك
        مباشرة — الصلاحيات (RLS policies) نفسها مكتوبة في ملف <code dir="ltr">supabase/migrations/0001_init.sql</code> وشغالة فعلياً على مستوى قاعدة البيانات، مش مجرد إخفاء في الواجهة.
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdminInner />
    </RoleGuard>
  );
}
