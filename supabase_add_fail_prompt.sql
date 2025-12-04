-- Add generic fail prompt to scenarios table
alter table scenarios 
add column if not exists generic_fail_prompt text;

