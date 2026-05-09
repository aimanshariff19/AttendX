create extension if not exists "pgcrypto";

create table if not exists users (
    id text primary key,
    password text not null,
    name text not null,
    role text not null check (role in ('faculty', 'student', 'hod')),
    department text,
    program text,
    sem text,
    section text,
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
    time text not null,
    "numClasses" int not null default 1,
    records jsonb not null default '[]'::jsonb,
    created_at timestamptz default now(),
    unique ("courseId", date, time)
);

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    "studentId" text not null references users(id) on delete cascade,
    type text not null default 'attendance',
    message text not null,
    created_at timestamptz default now()
);

insert into users (id, password, name, role, department) values
    ('hod_cse', 'hod_cse123', 'CSE HOD', 'hod', 'CSE'),
    ('hod_ece', 'hod_ece123', 'ECE HOD', 'hod', 'ECE'),
    ('hod_civil', 'hod_civil123', 'Civil HOD', 'hod', 'CIVIL'),
    ('hod_me', 'hod_me123', 'Mechanical HOD', 'hod', 'ME'),
    ('hod_ise', 'hod_ise123', 'ISE HOD', 'hod', 'ISE'),
    ('faculty_cse_1', 'faculty123', 'CSE Faculty', 'faculty', 'CSE'),
    ('faculty_ece_1', 'faculty123', 'ECE Faculty', 'faculty', 'ECE'),
    ('faculty_civil_1', 'faculty123', 'Civil Faculty', 'faculty', 'CIVIL'),
    ('faculty_me_1', 'faculty123', 'ME Faculty', 'faculty', 'ME'),
    ('faculty_ise_1', 'faculty123', 'ISE Faculty', 'faculty', 'ISE')
on conflict (id) do update set
    password = excluded.password,
    name = excluded.name,
    role = excluded.role,
    department = excluded.department;

insert into users (id, password, name, role, department, program, sem, section, "parentPhone") values
    ('1AT24CS001', '1AT24CS001', 'CSE Student 1', 'student', 'CSE', 'CSE', '3', 'A', '9000000001'),
    ('1AT24CS002', '1AT24CS002', 'CSE Student 2', 'student', 'CSE', 'CSE', '3', 'A', '9000000002'),
    ('1AT24EC001', '1AT24EC001', 'ECE Student 1', 'student', 'ECE', 'ECE', '3', 'A', '9000000003'),
    ('1AT24CV001', '1AT24CV001', 'Civil Student 1', 'student', 'CIVIL', 'CIVIL', '3', 'A', '9000000004'),
    ('1AT24ME001', '1AT24ME001', 'ME Student 1', 'student', 'ME', 'ME', '3', 'A', '9000000005'),
    ('1AT24IS001', '1AT24IS001', 'ISE Student 1', 'student', 'ISE', 'ISE', '3', 'A', '9000000006')
on conflict (id) do update set
    password = excluded.password,
    name = excluded.name,
    role = excluded.role,
    department = excluded.department,
    program = excluded.program,
    sem = excluded.sem,
    section = excluded.section,
    "parentPhone" = excluded."parentPhone";

insert into courses (subject, "subjectCode", "facultyId", department, program, sem, section) values
    ('Data Structures', 'CS301', 'faculty_cse_1', 'CSE', 'CSE', '3', 'A'),
    ('Analog Electronics', 'EC301', 'faculty_ece_1', 'ECE', 'ECE', '3', 'A'),
    ('Surveying', 'CV301', 'faculty_civil_1', 'CIVIL', 'CIVIL', '3', 'A'),
    ('Thermodynamics', 'ME301', 'faculty_me_1', 'ME', 'ME', '3', 'A'),
    ('Database Systems', 'IS301', 'faculty_ise_1', 'ISE', 'ISE', '3', 'A')
on conflict do nothing;
