-- Add generic prompts to scenarios table
alter table scenarios 
add column if not exists generic_execution_prompt text,
add column if not exists generic_evaluator_prompt text;
