-- Script to recreate tables from scratch

-- 1. Create table scenarios
create table scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create table steps
create table steps (
  id uuid primary key default gen_random_uuid(),
  title text,
  execution_prompt text,
  execution_inject_user boolean default false,
  success_prompt text,  -- Evaluator Prompt
  success_inject_user boolean default false,
  order_index integer,
  created_at timestamptz default now(),
  scenario_id uuid references scenarios(id) on delete cascade
);

-- 3. Disable RLS for development (optional, prevents permission issues)
alter table scenarios disable row level security;
alter table steps disable row level security;

