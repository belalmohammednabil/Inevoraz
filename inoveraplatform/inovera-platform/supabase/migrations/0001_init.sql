-- ============================================================================
-- INOVERA / IS³ — Student Success Platform
-- Core schema + Row Level Security + seed data
-- Run this once in your Supabase project's SQL editor (or via `supabase db push`)
-- ============================================================================

-- ---------- extensions ----------
create extension if not exists "pgcrypto";

-- ---------- role enum ----------
do $$ begin
  create type app_role as enum ('admin', 'counselor', 'teacher', 'student', 'company');
exception
  when duplicate_object then null;
end $$;

-- ============================================================================
-- CORE ORG TABLES
-- ============================================================================

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  governorate text not null,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                 -- e.g. S1001
  national_id text unique,
  full_name text not null,
  gender text check (gender in ('male','female')),
  birth_date date,
  grade text,                                 -- الأول/الثاني/الثالث الثانوي
  class_section text,
  major text,
  address text,
  governorate text,
  city text,
  school_id uuid references schools(id) on delete set null,
  phone text,
  email text,
  guardian_name text,
  guardian_relation text,
  guardian_job text,
  guardian_phone text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PROFILES — links a Supabase auth user to a role and (optionally) a student
-- ============================================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'student',
  full_name text not null,
  school_id uuid references schools(id) on delete set null,
  student_id uuid references students(id) on delete set null,
  created_at timestamptz not null default now()
);

-- helper: current user's role, used inside RLS policies
create or replace function my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function my_student_id() returns uuid
language sql stable security definer set search_path = public as $$
  select student_id from profiles where id = auth.uid()
$$;

-- ============================================================================
-- STUDENT DATA TABLES
-- ============================================================================

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','late')),
  excused boolean default false,
  recorded_by text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists wellbeing (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  recorded_at date not null default current_date,
  overall_score numeric not null check (overall_score between 0 and 100),
  school_satisfaction numeric,
  belonging numeric,
  engagement numeric,
  self_confidence numeric,
  social_relationships numeric
);

create table if not exists behavior (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  recorded_at date not null default current_date,
  behavior_points numeric check (behavior_points between 0 and 100),
  violations_count int default 0,
  positive_notes text,
  negative_notes text,
  discipline_level text check (discipline_level in ('ممتاز','جيد','ضعيف'))
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  communication numeric,
  teamwork numeric,
  leadership numeric,
  problem_solving numeric,
  critical_thinking numeric,
  creativity numeric,
  time_management numeric,
  responsibility numeric,
  innovation numeric,
  updated_at timestamptz not null default now()
);

create table if not exists career_profile (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade unique,
  career_interests text,
  suitable_job text,
  suggested_path text,
  market_readiness numeric check (market_readiness between 0 and 100),
  had_training boolean default false,
  training_org text,
  training_rating numeric,
  training_hours numeric,
  academic_risk text check (academic_risk in ('منخفض','متوسط','مرتفع')),
  attendance_risk text check (attendance_risk in ('منخفض','متوسط','مرتفع')),
  behavior_risk text check (behavior_risk in ('منخفض','متوسط','مرتفع')),
  employability numeric,
  entrepreneurship numeric,
  overall_readiness numeric check (overall_readiness between 0 and 100),
  updated_at timestamptz not null default now()
);

create table if not exists interventions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  risk_level text not null check (risk_level in ('منخفض','متوسط','مرتفع')),
  priority text not null default 'عادية' check (priority in ('عادية','عاجلة')),
  reason text,
  recommendation text,
  plan text,
  responsible_person text,
  review_date date,
  status text not null default 'مفتوح' check (status in ('مفتوح','مغلق')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PARTNER / EMPLOYER PORTAL — the new monetizable layer
-- ============================================================================

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  industry text,
  logo_url text,
  website text,
  contact_email text,
  contact_phone text,
  plan text not null default 'free' check (plan in ('free','pro','featured')),
  verified boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists internships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  description text,
  specialization text,
  governorate text,
  min_readiness_score numeric default 0,
  spots_available int default 1,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  internship_id uuid not null references internships(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status text not null default 'applied'
    check (status in ('applied','shortlisted','interview','hired','rejected')),
  notes text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (internship_id, student_id)
);

-- ============================================================================
-- A PRIVACY-SAFE VIEW FOR COMPANIES
-- Companies never see raw PII (national ID, phone, address, guardian info) —
-- only what they need to evaluate a candidate.
-- ============================================================================

create or replace view talent_pool as
select
  s.id as student_id,
  s.code,
  s.grade,
  s.major,
  s.governorate,
  sc.name as school_name,
  cp.market_readiness,
  cp.overall_readiness,
  cp.employability,
  sk.communication, sk.teamwork, sk.leadership, sk.problem_solving,
  sk.critical_thinking, sk.creativity, sk.time_management,
  sk.responsibility, sk.innovation,
  coalesce(
    (select round(avg(case when a.status = 'present' then 100.0 else 0 end), 1)
     from attendance a where a.student_id = s.id
     and a.date > current_date - interval '90 days'),
    0
  ) as attendance_rate_90d
from students s
left join schools sc on sc.id = s.school_id
left join career_profile cp on cp.student_id = s.id
left join skills sk on sk.student_id = s.id;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table schools enable row level security;
alter table students enable row level security;
alter table profiles enable row level security;
alter table attendance enable row level security;
alter table wellbeing enable row level security;
alter table behavior enable row level security;
alter table skills enable row level security;
alter table career_profile enable row level security;
alter table interventions enable row level security;
alter table companies enable row level security;
alter table internships enable row level security;
alter table applications enable row level security;

-- profiles: everyone can read their own; staff roles can read all
create policy "profiles_self_read" on profiles for select
  using (id = auth.uid() or my_role() in ('admin','counselor','teacher'));
create policy "profiles_self_update" on profiles for update
  using (id = auth.uid());
create policy "profiles_admin_write" on profiles for insert
  with check (my_role() = 'admin' or id = auth.uid());

-- schools: readable by everyone signed in; writable by admin only
create policy "schools_read_all" on schools for select using (auth.role() = 'authenticated');
create policy "schools_admin_write" on schools for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- students: staff (admin/counselor/teacher) full read; student reads only self
create policy "students_staff_read" on students for select
  using (my_role() in ('admin','counselor','teacher') or id = my_student_id());
create policy "students_staff_write" on students for insert
  with check (my_role() in ('admin','counselor','teacher'));
create policy "students_staff_update" on students for update
  using (my_role() in ('admin','counselor','teacher'));
create policy "students_admin_delete" on students for delete
  using (my_role() = 'admin');

-- attendance / academic-ish tables: staff full; student reads own
create policy "attendance_staff_all" on attendance for all
  using (my_role() in ('admin','counselor','teacher'))
  with check (my_role() in ('admin','counselor','teacher'));
create policy "attendance_student_read" on attendance for select
  using (student_id = my_student_id());

-- wellbeing & behavior: admin/counselor only (teacher excluded, per role matrix) + self-read for student
create policy "wellbeing_care_team" on wellbeing for all
  using (my_role() in ('admin','counselor'))
  with check (my_role() in ('admin','counselor'));
create policy "wellbeing_student_read" on wellbeing for select
  using (student_id = my_student_id());

create policy "behavior_staff_all" on behavior for all
  using (my_role() in ('admin','counselor','teacher'))
  with check (my_role() in ('admin','counselor','teacher'));
create policy "behavior_student_read" on behavior for select
  using (student_id = my_student_id());

create policy "skills_staff_all" on skills for all
  using (my_role() in ('admin','counselor','teacher'))
  with check (my_role() in ('admin','counselor','teacher'));
create policy "skills_student_read" on skills for select
  using (student_id = my_student_id());

create policy "career_staff_all" on career_profile for all
  using (my_role() in ('admin','counselor','teacher'))
  with check (my_role() in ('admin','counselor','teacher'));
create policy "career_student_read" on career_profile for select
  using (student_id = my_student_id());

-- interventions: admin/counselor ONLY — matches the real permission matrix
create policy "interventions_care_team" on interventions for all
  using (my_role() in ('admin','counselor'))
  with check (my_role() in ('admin','counselor'));

-- companies: company owner manages their own; staff can read all (for verification)
create policy "companies_owner_all" on companies for all
  using (owner_id = auth.uid() or my_role() = 'admin')
  with check (owner_id = auth.uid() or my_role() = 'admin');
create policy "companies_staff_read" on companies for select
  using (my_role() in ('admin','counselor','teacher'));

-- internships: public read (any authenticated user incl. students); owner company writes
create policy "internships_read_all" on internships for select using (auth.role() = 'authenticated');
create policy "internships_owner_write" on internships for insert
  with check (company_id in (select id from companies where owner_id = auth.uid()));
create policy "internships_owner_update" on internships for update
  using (company_id in (select id from companies where owner_id = auth.uid()) or my_role() = 'admin');
create policy "internships_owner_delete" on internships for delete
  using (company_id in (select id from companies where owner_id = auth.uid()) or my_role() = 'admin');

-- applications: student manages own applications; company sees applications to their internships
create policy "applications_student_own" on applications for select
  using (student_id = my_student_id());
create policy "applications_student_insert" on applications for insert
  with check (student_id = my_student_id());
create policy "applications_company_read" on applications for select
  using (internship_id in (
    select i.id from internships i
    join companies c on c.id = i.company_id
    where c.owner_id = auth.uid()
  ));
create policy "applications_company_update" on applications for update
  using (internship_id in (
    select i.id from internships i
    join companies c on c.id = i.company_id
    where c.owner_id = auth.uid()
  ));
create policy "applications_staff_all" on applications for all
  using (my_role() in ('admin','counselor'))
  with check (my_role() in ('admin','counselor'));

-- ============================================================================
-- SEED DATA — the 8 demo students from the original INOVERA prototype
-- ============================================================================

insert into schools (name, governorate, city) values
  ('مدرسة التكنولوجيا التطبيقية', 'القاهرة', 'القاهرة'),
  ('مدرسة الأمل الرسمية', 'الجيزة', 'الجيزة'),
  ('مدرسة المعرفة النموذجية', 'الإسكندرية', 'الإسكندرية'),
  ('مدرسة المتفوقين STEM', 'القاهرة', 'القاهرة الجديدة'),
  ('مدرسة النور الخاصة', 'الجيزة', '6 أكتوبر'),
  ('مدرسة النيل الدولية', 'القاهرة', 'المعادي')
on conflict do nothing;

insert into students (code, national_id, full_name, gender, grade, major, governorate, school_id)
select v.code, v.national_id, v.full_name, v.gender, v.grade, v.major, v.governorate, sc.id
from (values
  ('S1001','29901010100011','أحمد محمد علي','male','الثالث الثانوي','علمي رياضة','القاهرة','مدرسة التكنولوجيا التطبيقية'),
  ('S1002','30002020200022','سارة خالد عبدالله','female','الثاني الثانوي','أدبي','الجيزة','مدرسة الأمل الرسمية'),
  ('S1003','29903030300033','عمر ياسر عبدالرحمن','male','الأول الثانوي','عام','الإسكندرية','مدرسة المعرفة النموذجية'),
  ('S1004','30004040400044','مريم محمود مصطفى','female','الثالث الثانوي','تكنولوجيا المعلومات','القاهرة','مدرسة التكنولوجيا التطبيقية'),
  ('S1005','29905050500055','يوسف شريف إبراهيم','male','الثاني الثانوي','طاقة جديدة','القاهرة','مدرسة المتفوقين STEM'),
  ('S1006','30006060600066','نور الهدى حسين','female','الأول الثانوي','عام','الجيزة','مدرسة النور الخاصة'),
  ('S1007','29907070700077','كريم طارق حسن','male','الثالث الثانوي','ميكاترونكس','القاهرة','مدرسة المتفوقين STEM'),
  ('S1008','30008080800088','فاطمة الزهراء عادل','female','الثاني الثانوي','ذكاء اصطناعي','القاهرة','مدرسة النيل الدولية')
) as v(code, national_id, full_name, gender, grade, major, governorate, school_name)
join schools sc on sc.name = v.school_name
on conflict (code) do nothing;

insert into career_profile (student_id, market_readiness, overall_readiness, employability, academic_risk, attendance_risk, behavior_risk)
select id, r.readiness, r.readiness, r.readiness - 5, 'منخفض', 'منخفض', 'منخفض'
from students s
join (values
  ('S1001', 92::numeric), ('S1002', 78), ('S1003', 65), ('S1004', 95),
  ('S1005', 84), ('S1006', 89), ('S1007', 72), ('S1008', 91)
) as r(code, readiness) on r.code = s.code
on conflict (student_id) do nothing;

insert into skills (student_id, communication, teamwork, leadership, problem_solving, critical_thinking, creativity, time_management, responsibility, innovation)
select id, 85, 88, 80, 82, 79, 84, 81, 90, 78 from students
on conflict do nothing;

-- a handful of attendance rows so the "live" attendance rate isn't empty
insert into attendance (student_id, date, status)
select s.id, d.date, case when random() < 0.9 then 'present' else 'absent' end
from students s
cross join generate_series(current_date - interval '29 days', current_date, interval '1 day') as d(date)
on conflict do nothing;

insert into companies (name, industry, contact_email, plan, verified) values
  ('شركة فودافون مصر', 'اتصالات', 'partners@vodafone.example', 'featured', true),
  ('بنك مصر', 'مصرفي', 'careers@banquemisr.example', 'pro', true),
  ('القرية الذكية', 'تكنولوجيا', 'hr@smart-village.example', 'pro', true)
on conflict do nothing;
