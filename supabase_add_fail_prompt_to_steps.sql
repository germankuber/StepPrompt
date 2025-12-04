-- Add fail prompt columns to steps table
alter table steps 
add column if not exists fail_prompt text,
add column if not exists fail_inject_user boolean default false;

