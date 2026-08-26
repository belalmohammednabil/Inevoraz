import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type { Application, Company } from "../../lib/types";

const STAGES: Application["status"][] = ["applied", "shortlisted", "interview", "hired", "rejected"];
const STAGE_LABEL: Record<string, string> = {
  applied: "تقدّم",
  shortlisted: "مرشّح",
  interview: "مقابلة",
  hired: "تم التوظيف 🎉",
  rejected: "مرفوض",
};

export default function Applications() {
  const { company } = useOutletContext<{ company: Company }>();
  const [rows, setRows] = useState<Application[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("applications")
      .select("*, internships!inner(title, company_id), students(full_name, code)")
      .eq("internships.company_id", company.id)
      .order("applied_at", { ascending: false });
    setRows((data as any) ?? []);
  }

  async function updateStatus(id: string, status: Application["status"]) {
    await supabase.from("applications").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-[#2e2560] mb-1">متابعة المتقدمين</h1>
      <p className="text-slate-500 text-sm mb-5">
        {rows.length} طلب — لما تحدد "تم التوظيف" ده اللحظة اللي هيتفعّل فيها احتساب أي عمولة توظيف.
      </p>

      <div className="space-y-3">
        {rows.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{a.students?.full_name}</div>
              <div className="text-xs text-slate-500">{a.internships?.title}</div>
            </div>
            <select
              value={a.status}
              onChange={(e) => updateStatus(a.id, e.target.value as Application["status"])}
              className="text-xs font-semibold rounded-lg border border-slate-200 px-2 py-1.5"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        ))}
        {rows.length === 0 && <div className="text-slate-400 text-sm">لسه معندكش متقدمين على فرصك.</div>}
      </div>
    </div>
  );
}
