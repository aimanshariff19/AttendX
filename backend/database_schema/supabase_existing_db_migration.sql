alter table users add column if not exists program text;
alter table users add column if not exists sem text;
alter table users add column if not exists section text;
alter table users add column if not exists "parentPhone" text;

alter table courses add column if not exists subject text;
alter table courses add column if not exists "subjectCode" text;
alter table courses add column if not exists "facultyId" text;
alter table courses add column if not exists program text;
alter table courses add column if not exists sem text;
alter table courses add column if not exists section text;

alter table attendance add column if not exists "courseId" integer;
alter table attendance add column if not exists time text;
alter table attendance add column if not exists "numClasses" integer default 1;
alter table attendance add column if not exists records jsonb default '[]'::jsonb;
alter table attendance alter column status drop not null;

alter table notifications add column if not exists "studentId" text;
alter table notifications add column if not exists user_id text;
alter table notifications add column if not exists title text;
alter table notifications add column if not exists type text default 'attendance';
alter table notifications add column if not exists message text;
alter table notifications alter column title drop not null;

update courses
set
    subject = coalesce(subject, name),
    "subjectCode" = coalesce("subjectCode", code),
    "facultyId" = coalesce("facultyId", faculty_id),
    program = coalesce(program, 'CSE'),
    sem = coalesce(sem, '3'),
    section = coalesce(section, 'A')
where subject is null or "facultyId" is null or program is null or sem is null or section is null;

update attendance
set
    "courseId" = coalesce("courseId", course_id),
    time = coalesce(time, '09:00'),
    "numClasses" = coalesce("numClasses", 1),
    records = case
        when jsonb_array_length(coalesce(records, '[]'::jsonb)) > 0 then records
        else jsonb_build_array(jsonb_build_object(
            'studentId', student_id,
            'status', case when lower(status) = 'present' then 'Present' else 'Absent' end,
            'reason', ''
        ))
    end
where "courseId" is null or time is null or records = '[]'::jsonb;

insert into users (id, password, name, role, department, program, sem, section, "parentPhone") values
    ('hod_cse', 'hod_cse123', 'CSE HOD', 'hod', 'CSE', null, null, null, null),
    ('hod_ece', 'hod_ece123', 'ECE HOD', 'hod', 'ECE', null, null, null, null),
    ('hod_civil', 'hod_civil123', 'Civil HOD', 'hod', 'CIVIL', null, null, null, null),
    ('hod_me', 'hod_me123', 'Mechanical HOD', 'hod', 'ME', null, null, null, null),
    ('hod_ise', 'hod_ise123', 'ISE HOD', 'hod', 'ISE', null, null, null, null),
    ('faculty_cse_1', 'faculty123', 'CSE Faculty', 'faculty', 'CSE', null, null, null, null),
    ('faculty_ece_1', 'faculty123', 'ECE Faculty', 'faculty', 'ECE', null, null, null, null),
    ('faculty_civil_1', 'faculty123', 'Civil Faculty', 'faculty', 'CIVIL', null, null, null, null),
    ('faculty_me_1', 'faculty123', 'ME Faculty', 'faculty', 'ME', null, null, null, null),
    ('faculty_ise_1', 'faculty123', 'ISE Faculty', 'faculty', 'ISE', null, null, null, null),
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

insert into courses (name, code, faculty_id, department, semester, subject, "subjectCode", "facultyId", program, sem, section) values
    ('Data Structures', 'CS301', 'faculty_cse_1', 'CSE', '3', 'Data Structures', 'CS301', 'faculty_cse_1', 'CSE', '3', 'A'),
    ('Analog Electronics', 'EC301', 'faculty_ece_1', 'ECE', '3', 'Analog Electronics', 'EC301', 'faculty_ece_1', 'ECE', '3', 'A'),
    ('Surveying', 'CV301', 'faculty_civil_1', 'CIVIL', '3', 'Surveying', 'CV301', 'faculty_civil_1', 'CIVIL', '3', 'A'),
    ('Thermodynamics', 'ME301', 'faculty_me_1', 'ME', '3', 'Thermodynamics', 'ME301', 'faculty_me_1', 'ME', '3', 'A'),
    ('Database Systems', 'IS301', 'faculty_ise_1', 'ISE', '3', 'Database Systems', 'IS301', 'faculty_ise_1', 'ISE', '3', 'A')
on conflict do nothing;

-- Recommended: PostgreSQL treats `time` as a keyword; Supabase/API may omit it. Rename:
-- backend/database_schema/supabase_rename_attendance_time_to_time_slot.sql
