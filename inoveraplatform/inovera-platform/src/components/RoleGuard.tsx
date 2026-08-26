import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { AppRole } from "../lib/types";

export default function RoleGuard({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile) return null;
  if (!allow.includes(profile.role)) {
    return (
      <div className="p-10 text-center text-slate-500">
        غير مصرّح لدورك ({profile.role}) بالوصول لهذه الصفحة.
      </div>
    );
  }
  return <>{children}</>;
}
