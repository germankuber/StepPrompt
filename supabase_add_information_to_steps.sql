-- Add information column to steps table
alter table steps
add column if not exists information text;

