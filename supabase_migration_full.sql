-- 1. Create table scenarios (if not exists)
create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create table steps (if not exists) - This was missing!
create table if not exists steps (
  id uuid primary key default gen_random_uuid(),
  title text,
  execution_prompt text,
  execution_inject_user boolean default false,
  validation_prompt text,
  validation_inject_user boolean default false,
  success_prompt text,
  success_inject_user boolean default false,
  order_index integer,
  created_at timestamptz default now()
);

-- 3. Add scenario_id column to steps table if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'steps' and column_name = 'scenario_id') then
    alter table steps 
    add column scenario_id uuid references scenarios(id) on delete cascade;
  end if;
end $$;

