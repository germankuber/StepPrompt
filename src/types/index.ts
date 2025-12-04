export interface PromptConfig {
  content: string;
  injectUserMessage: boolean;
}

export interface Step {
  id: string;
  title: string;
  execution: PromptConfig;
  successCondition: PromptConfig; // Renamed to Evaluator Prompt in UI, but keeping key for compatibility or renaming it?
  failCondition: PromptConfig; // Fail Prompt for handling failures
  // validation: PromptConfig; // REMOVED
  order_index: number;
}

// Helper function to normalize steps and ensure all required fields are present
export function normalizeStep(step: Partial<Step> & { id: string; title: string; order_index: number }): Step {
  return {
    id: step.id,
    title: step.title,
    order_index: step.order_index,
    execution: step.execution || { content: '', injectUserMessage: false },
    successCondition: step.successCondition || { content: '', injectUserMessage: false },
    failCondition: step.failCondition || { content: '', injectUserMessage: false },
  };
}

// Database types helper (if we were mirroring Supabase DB structure closely)
export interface DbStep {
  id: string;
  title: string;
  execution_prompt: string;
  execution_inject_user: boolean;
  success_prompt: string;
  success_inject_user: boolean;
  fail_prompt: string;
  fail_inject_user: boolean;
  order_index: number;
  created_at?: string;
}
