import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { to: "/", label: "لوحة القيادة", icon: "📊" },
    { to: "/directory", label: "دليل الطلاب", icon: "📋" },
    { to: "/interventions", label: "التدخلات", icon: "🚨" },
    { to: "/partner", label: "بوابة الشركاء", icon: "🤝" },
    { to: "/admin", label: "لوحة المشرف", icon: "⚙️" },
  ],
  counselor: [
    { to: "/", label: "لوحة القيادة", icon: "📊" },
    { to: "/directory", label: "دليل الطلاب", icon: "📋" },
    { to: "/interventions", label: "التدخلات", icon: "🚨" },
  ],
  teacher: [
    { to: "/", label: "لوحة القيادة", icon: "📊" },
    { to: "/directory", label: "دليل الطلاب", icon: "📋" },
  ],
  student: [
    { to: "/", label: "لوحة القيادة", icon: "📊" },
    { to: "/opportunities", label: "فرص التدريب", icon: "💼" },
  ],
  company: [
    { to: "/partner", label: "بوابة الشركاء", icon: "🤝" },
  ],
};

export default function Layout() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">جارِ التحميل...</div>;
  }
  if (!session || !profile) return <Navigate to="/login" replace />;

  const items = NAV_BY_ROLE[profile.role] ?? [];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-[#2e2560] text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="text-xl font-extrabold tracking-wide">INOVERA</div>
          <div className="text-xs text-white/60 mt-1">Student Success System</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-[#5b3df6] text-white" : "text-white/75 hover:bg-white/10"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-sm">
          <div className="font-semibold">{profile.full_name}</div>
          <div className="text-white/50 text-xs mb-3">{roleLabel(profile.role)}</div>
          <button
            onClick={() => signOut()}
            className="w-full rounded-lg bg-white/10 hover:bg-white/20 py-2 text-xs font-medium"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-[#f6f5fb] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function roleLabel(role: string) {
  return (
    {
      admin: "مدير نظام",
      counselor: "مرشد طلابي",
      teacher: "معلم",
      student: "طالب",
      company: "شريك صناعي",
    }[role] ?? role
  );
}
