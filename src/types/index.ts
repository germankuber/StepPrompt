export interface PromptConfig {
  content: string;
  injectUserMessage: boolean;
}

export interface Step {
  id: string;
  title: string;
  execution: PromptConfig;
  validation: PromptConfig;
  successCondition: PromptConfig;
  order_index: number;
}

// Database types helper (if we were mirroring Supabase DB structure closely)
export interface DbStep {
  id: string;
  title: string;
  execution_prompt: string;
  execution_inject_user: boolean;
  validation_prompt: string;
  validation_inject_user: boolean;
  success_prompt: string;
  success_inject_user: boolean;
  order_index: number;
  created_at?: string;
}

