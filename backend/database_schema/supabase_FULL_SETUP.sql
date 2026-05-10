-- ============================================================
-- AttendX - FULL SUPABASE SETUP (Run this once in SQL Editor)
-- ============================================================

-- Step 1: Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- Step 2: Create Tables
-- ============================================================

create table if not exists users (
    id text primary key,
    password text not null,
    name text not null,
    role text not null check (role in ('faculty', 'student', 'hod')),
    department text,
    program text,
    sem text,
    section text,
    phone text,
    email text,
    "parentPhone" text,
    created_at timestamptz default now()
);

create table if not exists courses (
    id uuid primary key default gen_random_uuid(),
    subject text not null,
    "subjectCode" text,
    "facultyId" text not null references users(id),
    department text not null,
    program text not null,
    sem text not null,
    section text not null,
    created_at timestamptz default now()
);

create table if not exists attendance (
    id uuid primary key default gen_random_uuid(),
    "courseId" uuid not null references courses(id) on delete cascade,
    date date not null,
    time_slot text not null,
    "numClasses" int not null default 1,
    records jsonb not null default '[]'::jsonb,
    created_at timestamptz default now(),
    unique ("courseId", date, time_slot)
);

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    "studentId" text references users(id) on delete cascade,
    user_id text,
    title text,
    type text not null default 'attendance',
    message text not null default '',
    recipient_role text,
    phone text,
    messages jsonb,
    channels jsonb default '["app"]'::jsonb,
    created_at timestamptz default now()
);

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

-- ============================================================
-- Step 3: Seed HODs
-- ============================================================

insert into users (id, password, name, role, department) values
    ('hod_cse',   'hod_cse123',   'CSE HOD',          'hod', 'CSE'),
    ('hod_ece',   'hod_ece123',   'ECE HOD',           'hod', 'ECE'),
    ('hod_civil', 'hod_civil123', 'Civil HOD',         'hod', 'CIVIL'),
    ('hod_me',    'hod_me123',    'Mechanical HOD',    'hod', 'ME'),
    ('hod_ise',   'hod_ise123',   'ISE HOD',           'hod', 'ISE')
on conflict (id) do update set
    password   = excluded.password,
    name       = excluded.name,
    role       = excluded.role,
    department = excluded.department;

-- ============================================================
-- Step 4: Seed Faculty
-- ============================================================

insert into users (id, password, name, role, department) values
    ('faculty_cse_1',   'faculty123', 'CSE Faculty',   'faculty', 'CSE'),
    ('faculty_ece_1',   'faculty123', 'ECE Faculty',   'faculty', 'ECE'),
    ('faculty_civil_1', 'faculty123', 'Civil Faculty', 'faculty', 'CIVIL'),
    ('faculty_me_1',    'faculty123', 'ME Faculty',    'faculty', 'ME'),
    ('faculty_ise_1',   'faculty123', 'ISE Faculty',   'faculty', 'ISE'),
    ('coord_cse_3a',    'coord123',   'CSE 3A Coordinator', 'faculty', 'CSE')
on conflict (id) do update set
    password   = excluded.password,
    name       = excluded.name,
    role       = excluded.role,
    department = excluded.department;

-- ============================================================
-- Step 5: Seed Students
-- ============================================================

insert into users (id, password, name, role, department, program, sem, section, "parentPhone") values
    ('1AT24CS001', '1AT24CS001', 'CSE Student 1',   'student', 'CSE',   'CSE',   '3', 'A', '9148044864'),
    ('1AT24CS002', '1AT24CS002', 'CSE Student 2',   'student', 'CSE',   'CSE',   '3', 'A', '9000000002'),
    ('1AT24EC001', '1AT24EC001', 'ECE Student 1',   'student', 'ECE',   'ECE',   '3', 'A', '9000000003'),
    ('1AT24CV001', '1AT24CV001', 'Civil Student 1', 'student', 'CIVIL', 'CIVIL', '3', 'A', '9000000004'),
    ('1AT24ME001', '1AT24ME001', 'ME Student 1',    'student', 'ME',    'ME',    '3', 'A', '9000000005'),
    ('1AT24IS001', '1AT24IS001', 'ISE Student 1',   'student', 'ISE',   'ISE',   '3', 'A', '9000000006')
on conflict (id) do update set
    password      = excluded.password,
    name          = excluded.name,
    role          = excluded.role,
    department    = excluded.department,
    program       = excluded.program,
    sem           = excluded.sem,
    section       = excluded.section,
    "parentPhone" = excluded."parentPhone";

-- ============================================================
-- Step 6: Seed Class Coordinator
-- ============================================================

insert into class_coordinators (user_id, name, phone, department, program, sem, section) values
('coord_cse_3a', 'CSE 3A Coordinator', '9000000101', 'CSE', 'CSE', '3', 'A')
on conflict (department, program, sem, section) do update set
    user_id = excluded.user_id,
    name    = excluded.name,
    phone   = excluded.phone;

-- ============================================================
-- Step 7: Seed Courses (basic per department + all programs)
-- ============================================================

insert into courses (subject, "subjectCode", "facultyId", department, program, sem, section) values
-- CSE - CSE program
('Data Structures',      'CS-CSE-3A', 'faculty_cse_1', 'CSE', 'CSE',  '3', 'A'),
('Data Structures',      'CS-CSE-3B', 'faculty_cse_1', 'CSE', 'CSE',  '3', 'B'),
('Data Structures',      'CS-CSE-3C', 'faculty_cse_1', 'CSE', 'CSE',  '3', 'C'),
('Data Structures',      'CS-CSE-3D', 'faculty_cse_1', 'CSE', 'CSE',  '3', 'D'),
-- CSE - CSD program
('Software Engineering', 'CS-CSD-3A', 'faculty_cse_1', 'CSE', 'CSD',  '3', 'A'),
('Software Engineering', 'CS-CSD-3B', 'faculty_cse_1', 'CSE', 'CSD',  '3', 'B'),
-- CSE - AIML program
('Machine Learning',     'CS-AIML-3A','faculty_cse_1', 'CSE', 'AIML', '3', 'A'),
('Machine Learning',     'CS-AIML-3B','faculty_cse_1', 'CSE', 'AIML', '3', 'B'),
-- ISE
('Database Systems',     'IS-ISE-3A', 'faculty_ise_1', 'ISE', 'ISE',  '3', 'A'),
('Database Systems',     'IS-ISE-3B', 'faculty_ise_1', 'ISE', 'ISE',  '3', 'B'),
('Database Systems',     'IS-ISE-3C', 'faculty_ise_1', 'ISE', 'ISE',  '3', 'C'),
('Database Systems',     'IS-ISE-3D', 'faculty_ise_1', 'ISE', 'ISE',  '3', 'D'),
('Data Science',         'IS-CSDS-3A','faculty_ise_1', 'ISE', 'CSDS', '3', 'A'),
('Data Science',         'IS-CSDS-3B','faculty_ise_1', 'ISE', 'CSDS', '3', 'B'),
-- ME
('Thermodynamics',       'ME-ME-3A',  'faculty_me_1',  'ME',  'ME',   '3', 'A'),
('Thermodynamics',       'ME-ME-3B',  'faculty_me_1',  'ME',  'ME',   '3', 'B'),
('Thermodynamics',       'ME-ME-3C',  'faculty_me_1',  'ME',  'ME',   '3', 'C'),
('Thermodynamics',       'ME-ME-3D',  'faculty_me_1',  'ME',  'ME',   '3', 'D'),
-- CIVIL
('Surveying',            'CV-CIVIL-3A','faculty_civil_1','CIVIL','CIVIL','3','A'),
('Surveying',            'CV-CIVIL-3B','faculty_civil_1','CIVIL','CIVIL','3','B'),
('Surveying',            'CV-CIVIL-3C','faculty_civil_1','CIVIL','CIVIL','3','C'),
('Surveying',            'CV-CIVIL-3D','faculty_civil_1','CIVIL','CIVIL','3','D'),
-- ECE
('Analog Electronics',   'EC-ECE-3A', 'faculty_ece_1', 'ECE', 'ECE',  '3', 'A'),
('Analog Electronics',   'EC-ECE-3B', 'faculty_ece_1', 'ECE', 'ECE',  '3', 'B'),
('Analog Electronics',   'EC-ECE-3C', 'faculty_ece_1', 'ECE', 'ECE',  '3', 'C'),
('Analog Electronics',   'EC-ECE-3D', 'faculty_ece_1', 'ECE', 'ECE',  '3', 'D')
on conflict do nothing;
