-- Remove deprecated columns from steps table
alter table steps 
drop column if exists validation_prompt,
drop column if exists validation_inject_user;

