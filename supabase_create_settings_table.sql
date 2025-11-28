create table app_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table app_settings disable row level security;

