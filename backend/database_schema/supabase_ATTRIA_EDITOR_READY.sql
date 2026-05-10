-- ============================================================
-- AttendX (Atria) — run in Supabase SQL Editor (fresh DB or after reset)
--
-- IMPORTANT: Backend uses attendance column `time_slot` (text), NOT `time`.
-- The name `time` is a Postgres keyword — PostgREST/Supabase often fails to show or write it reliably.
--
-- If you ALREADY created `attendance` with column `time`, run only the migration block at the bottom OR
-- `supabase_rename_attendance_time_to_time_slot.sql` then keep `time_slot` in all scripts going forward.
-- ============================================================

-- ---------------------------- users ----------------------------
create table if not exists users (
    id text primary key,
    password text not null,
    name text not null,
    email text unique,
    role text not null check (role in ('faculty', 'student', 'hod')),
    department text,
    program text,
    sem text,
    section text,
    "parentPhone" text,
    created_at timestamptz default now()
);

-- ---------------------------- courses ----------------------------
create table if not exists courses (
    id serial primary key,
    subject text not null,
    "subjectCode" text,
    "facultyId" text not null references users(id),
    department text not null,
    program text not null,
    sem text not null,
    section text not null,
    created_at timestamptz default now()
);

-- ---------------------------- attendance ----------------------------
create table if not exists attendance (
    id serial primary key,
    "courseId" integer not null references courses(id) on delete cascade,
    date date not null,
    time_slot text not null,
    "numClasses" integer not null default 1,
    records jsonb not null default '[]'::jsonb,
    created_at timestamptz default now(),
    unique ("courseId", date, time_slot)
);

-- ---------------------------- notifications ----------------------------
create table if not exists notifications (
    id serial primary key,
    "studentId" text not null references users(id) on delete cascade,
    type text not null default 'attendance',
    message text not null,
    created_at timestamptz default now()
);

-- ---------------------------- seed: users ----------------------------
insert into users (id, password, name, email, role, department, program, sem, section, "parentPhone") values
('hod_cse', 'hod_cse123', 'CSE HOD', 'hod_cse@atria.edu', 'hod', 'CSE', null, null, null, null),
('hod_ece', 'hod_ece123', 'ECE HOD', 'hod_ece@atria.edu', 'hod', 'ECE', null, null, null, null),
('hod_civil', 'hod_civil123', 'Civil HOD', 'hod_civil@atria.edu', 'hod', 'CIVIL', null, null, null, null),
('hod_me', 'hod_me123', 'ME HOD', 'hod_me@atria.edu', 'hod', 'ME', null, null, null, null),
('hod_ise', 'hod_ise123', 'ISE HOD', 'hod_ise@atria.edu', 'hod', 'ISE', null, null, null, null),
('faculty_cse_1', 'faculty123', 'CSE Faculty', 'faculty_cse@atria.edu', 'faculty', 'CSE', null, null, null, null),
('faculty_ece_1', 'faculty123', 'ECE Faculty', 'faculty_ece@atria.edu', 'faculty', 'ECE', null, null, null, null),
('faculty_civil_1', 'faculty123', 'Civil Faculty', 'faculty_civil@atria.edu', 'faculty', 'CIVIL', null, null, null, null),
('faculty_me_1', 'faculty123', 'ME Faculty', 'faculty_me@atria.edu', 'faculty', 'ME', null, null, null, null),
('faculty_ise_1', 'faculty123', 'ISE Faculty', 'faculty_ise@atria.edu', 'faculty', 'ISE', null, null, null, null),
('1AT24CS001', '1AT24CS001', 'CSE Student 1', 'cs001@atria.edu', 'student', 'CSE', 'CSE', '3', 'A', '9000000001'),
('1AT24CS002', '1AT24CS002', 'CSE Student 2', 'cs002@atria.edu', 'student', 'CSE', 'CSE', '3', 'A', '9000000002'),
('1AT24EC001', '1AT24EC001', 'ECE Student 1', 'ec001@atria.edu', 'student', 'ECE', 'ECE', '3', 'A', '9000000003'),
('1AT24CV001', '1AT24CV001', 'Civil Student 1', 'cv001@atria.edu', 'student', 'CIVIL', 'CIVIL', '3', 'A', '9000000004'),
('1AT24ME001', '1AT24ME001', 'ME Student 1', 'me001@atria.edu', 'student', 'ME', 'ME', '3', 'A', '9000000005'),
('1AT24IS001', '1AT24IS001', 'ISE Student 1', 'is001@atria.edu', 'student', 'ISE', 'ISE', '3', 'A', '9000000006')
on conflict (id) do nothing;

-- ---------------------------- seed: courses ----------------------------
insert into courses (subject, "subjectCode", "facultyId", department, program, sem, section)
select 'Data Structures', 'CS301', 'faculty_cse_1', 'CSE', 'CSE', '3', 'A'
where not exists (select 1 from courses where "subjectCode" = 'CS301');

insert into courses (subject, "subjectCode", "facultyId", department, program, sem, section)
select 'Analog Electronics', 'EC301', 'faculty_ece_1', 'ECE', 'ECE', '3', 'A'
where not exists (select 1 from courses where "subjectCode" = 'EC301');

insert into courses (subject, "subjectCode", "facultyId", department, program, sem, section)
select 'Surveying', 'CV301', 'faculty_civil_1', 'CIVIL', 'CIVIL', '3', 'A'
where not exists (select 1 from courses where "subjectCode" = 'CV301');

insert into courses (subject, "subjectCode", "facultyId", department, program, sem, section)
select 'Thermodynamics', 'ME301', 'faculty_me_1', 'ME', 'ME', '3', 'A'
where not exists (select 1 from courses where "subjectCode" = 'ME301');

insert into courses (subject, "subjectCode", "facultyId", department, program, sem, section)
select 'Database Systems', 'IS301', 'faculty_ise_1', 'ISE', 'ISE', '3', 'A'
where not exists (select 1 from courses where "subjectCode" = 'IS301');

-- ============================================================
-- SCHEMA PATCH — safe to re-run on existing databases
-- ============================================================

alter table users add column if not exists phone text;

alter table notifications alter column "studentId" drop not null;

alter table notifications add column if not exists user_id text;
alter table notifications add column if not exists title text;
alter table notifications add column if not exists recipient_role text;
alter table notifications add column if not exists phone text;
alter table notifications add column if not exists messages jsonb;
alter table notifications add column if not exists channels jsonb default '["app"]'::jsonb;

create table if not exists class_coordinators (
    id serial primary key,
    user_id text references users(id),
    name text not null,
    phone text,
    department text not null,
    program text not null,
    sem text not null,
    section text not null,
    created_at timestamptz default now(),
    unique (department, program, sem, section)
);

alter table users add column if not exists parent_language text default 'English';

-- ============================================================
-- LEGACY FIX: rename attendance.time → time_slot (same as backend)
-- Skips automatically if column `time` does not exist.
-- ============================================================

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attendance'
      and column_name = 'time'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attendance'
      and column_name = 'time_slot'
  ) then
    alter table attendance rename column time to time_slot;
  end if;
end $$;
