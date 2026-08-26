import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

interface DashboardStats {
  totalStudents: number;
  schools: number;
  avgReadiness: number | null;
  avgWellbeing: number | null;
  attendanceRate: number | null;
  openInterventions: number | null;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function load() {
    try {
      const isStudent = profile!.role === "student";
      const studentFilter = isStudent && profile!.student_id ? profile!.student_id : null;

      const studentsQuery = supabase.from("students").select("id", { count: "exact", head: true });
      const schoolsQuery = supabase.from("schools").select("id", { count: "exact", head: true });
      const readinessQuery = supabase
        .from("career_profile")
        .select("overall_readiness" + (studentFilter ? "" : ""))
        .then((r) => r);
      const wellbeingQuery = supabase.from("wellbeing").select("overall_score");
      const attendanceQuery = supabase
        .from("attendance")
        .select("status")
        .gte("date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
      const interventionsQuery = supabase
        .from("interventions")
        .select("id", { count: "exact", head: true })
        .eq("status", "مفتوح");

      const [
        { count: totalStudents },
        { count: schools },
        { data: readinessRows },
        { data: wellbeingRows },
        { data: attendanceRows },
        { count: openInterventions },
      ] = await Promise.all([
        studentsQuery,
        schoolsQuery,
        readinessQuery,
        wellbeingQuery,
        attendanceQuery,
        interventionsQuery,
      ]);

      const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);

      const readinessValues = (readinessRows ?? []).map((r: any) => r.overall_readiness).filter((v: any) => v != null);
      const wellbeingValues = (wellbeingRows ?? []).map((r: any) => r.overall_score).filter((v: any) => v != null);
      const attendanceValues = (attendanceRows ?? []).map((r: any) => (r.status === "present" ? 100 : 0));

      setStats({
        totalStudents: totalStudents ?? 0,
        schools: schools ?? 0,
        avgReadiness: avg(readinessValues),
        avgWellbeing: avg(wellbeingValues),
        attendanceRate: avg(attendanceValues),
        openInterventions: openInterventions,
      });
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ في تحميل البيانات");
    }
  }

  if (error) {
    return <div className="p-8 text-red-600 text-sm">{error}</div>;
  }
  if (!stats) {
    return <div className="p-8 text-slate-400">جارِ تحميل المؤشرات...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2e2560]">لوحة القيادة والمؤشرات المباشرة</h1>
        <p className="text-slate-500 text-sm mt-1">
          مرحباً {profile?.full_name} — البيانات هنا حقيقية ومباشرة من قاعدة البيانات، مش أرقام ثابتة.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي الطلاب المسجلين" value={stats.totalStudents} sub={`عبر ${stats.schools} مدرسة`} />
        <StatCard
          label="متوسط الجاهزية لسوق العمل"
          value={stats.avgReadiness != null ? `${stats.avgReadiness}%` : "—"}
          tone="green"
        />
        <StatCard
          label="متوسط مؤشر الرفاه النفسي"
          value={stats.avgWellbeing != null ? `${stats.avgWellbeing}` : "لا صلاحية / لا بيانات"}
          tone="amber"
        />
        <StatCard
          label="معدل الحضور (٣٠ يوم)"
          value={stats.attendanceRate != null ? `${stats.attendanceRate}%` : "—"}
          tone="brand"
        />
      </div>

      {stats.openInterventions != null && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-sm text-slate-500">حالات التدخل المفتوحة حالياً</div>
          <div className="text-3xl font-extrabold text-red-600 mt-1">{stats.openInterventions}</div>
        </div>
      )}

      <div className="text-xs text-slate-400">
        كل رقم فوق ده جاي من استعلام حقيقي على Supabase وقت فتح الصفحة — لو غيّرت بيانات في قاعدة البيانات هتتغير هنا فوراً.
      </div>
    </div>
  );
}
