export type AppRole = "admin" | "counselor" | "teacher" | "student" | "company";

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  school_id: string | null;
  student_id: string | null;
}

export interface School {
  id: string;
  name: string;
  governorate: string;
  city: string | null;
}

export interface Student {
  id: string;
  code: string;
  national_id: string | null;
  full_name: string;
  gender: "male" | "female" | null;
  grade: string | null;
  class_section: string | null;
  major: string | null;
  governorate: string | null;
  city: string | null;
  school_id: string | null;
  schools?: { name: string } | null;
  phone: string | null;
  email: string | null;
}

export interface CareerProfile {
  student_id: string;
  market_readiness: number | null;
  overall_readiness: number | null;
  employability: number | null;
  academic_risk: "منخفض" | "متوسط" | "مرتفع" | null;
  attendance_risk: "منخفض" | "متوسط" | "مرتفع" | null;
  behavior_risk: "منخفض" | "متوسط" | "مرتفع" | null;
}

export interface Intervention {
  id: string;
  student_id: string;
  risk_level: "منخفض" | "متوسط" | "مرتفع";
  priority: "عادية" | "عاجلة";
  reason: string | null;
  status: "مفتوح" | "مغلق";
  responsible_person: string | null;
  created_at: string;
  students?: { full_name: string; code: string } | null;
}

export interface Company {
  id: string;
  owner_id: string | null;
  name: string;
  industry: string | null;
  plan: "free" | "pro" | "featured";
  verified: boolean;
}

export interface Internship {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  specialization: string | null;
  governorate: string | null;
  min_readiness_score: number | null;
  spots_available: number | null;
  status: "open" | "closed";
  created_at: string;
  companies?: { name: string } | null;
}

export interface TalentPoolRow {
  student_id: string;
  code: string;
  grade: string | null;
  major: string | null;
  governorate: string | null;
  school_name: string | null;
  market_readiness: number | null;
  overall_readiness: number | null;
  employability: number | null;
  attendance_rate_90d: number | null;
  communication: number | null;
  teamwork: number | null;
  leadership: number | null;
}

export interface Application {
  id: string;
  internship_id: string;
  student_id: string;
  status: "applied" | "shortlisted" | "interview" | "hired" | "rejected";
  applied_at: string;
  internships?: { title: string; companies?: { name: string } | null } | null;
  students?: { full_name: string; code: string } | null;
}
