-- 1. Create table scenarios
create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Add scenario_id column to steps table if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'steps' and column_name = 'scenario_id') then
    alter table steps 
    add column scenario_id uuid references scenarios(id) on delete cascade;
  end if;
end $$;

