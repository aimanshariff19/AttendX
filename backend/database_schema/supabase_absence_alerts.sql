alter table users add column if not exists phone text;
alter table users add column if not exists "parentPhone" text;

alter table notifications add column if not exists "studentId" text;
alter table notifications add column if not exists user_id text;
alter table notifications add column if not exists title text;
alter table notifications add column if not exists recipient_role text;
alter table notifications add column if not exists phone text;
alter table notifications add column if not exists messages jsonb;
alter table notifications add column if not exists channels jsonb default '["app"]'::jsonb;
alter table notifications alter column "studentId" drop not null;

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

insert into users (id, password, name, email, role, department, phone) values
('coord_cse_3a', 'coord123', 'CSE 3A Coordinator', 'coord_cse_3a@atria.edu', 'faculty', 'CSE', '9000000101')
on conflict (id) do update set
    name = excluded.name,
    phone = excluded.phone;

insert into class_coordinators (user_id, name, phone, department, program, sem, section) values
('coord_cse_3a', 'CSE 3A Coordinator', '9000000101', 'CSE', 'CSE', '3', 'A')
on conflict (department, program, sem, section) do update set
    user_id = excluded.user_id,
    name = excluded.name,
    phone = excluded.phone;

update users
set "parentPhone" = coalesce("parentPhone", '9148044864')
where role = 'student' and id = '1AT24CS001';
