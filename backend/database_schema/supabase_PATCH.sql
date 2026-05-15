-- ============================================================
-- AttendX - SCHEMA PATCH (Run this in Supabase SQL Editor)
-- Fixes missing columns/tables that the backend requires
-- ============================================================

-- 1. Add missing 'phone' column to users
alter table users add column if not exists phone text;
alter table users add column if not exists photo text;
alter table users add column if not exists "facePhoto" text;
alter table users add column if not exists "faceSignature" text;

-- 1b. Allow the new admin portal role
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('faculty', 'student', 'hod', 'admin'));

-- 1c. Seed default admin login for the Admin portal.
--     Change this password after first successful login.
insert into users (id, password, name, email, role, department, program, sem, section, "parentPhone") values
('admin', 'admin123', 'AttendX Admin', 'admin@atria.edu', 'admin', null, null, null, null, null)
on conflict (id) do update set
    role = 'admin',
    name = excluded.name,
    email = excluded.email,
    password = excluded.password;

-- 2. Fix notifications table:
--    a) Make studentId nullable (alerts go to faculty & coordinators too)
alter table notifications alter column "studentId" drop not null;

--    b) Add all missing columns used by insertAlert()
alter table notifications add column if not exists user_id       text;
alter table notifications add column if not exists title         text;
alter table notifications add column if not exists recipient_role text;
alter table notifications add column if not exists phone         text;
alter table notifications add column if not exists messages      jsonb;
alter table notifications add column if not exists channels      jsonb default '["app"]'::jsonb;

-- 3. Create class_coordinators table (queried by getClassCoordinator())
create table if not exists class_coordinators (
    id          serial primary key,
    user_id     text references users(id),
    name        text not null,
    phone       text,
    department  text not null,
    program     text not null,
    sem         text not null,
    section     text not null,
    created_at  timestamptz default now(),
    unique (department, program, sem, section)
);
