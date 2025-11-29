export interface PromptConfig {
  content: string;
  injectUserMessage: boolean;
}

export interface Step {
  id: string;
  title: string;
  execution: PromptConfig;
  successCondition: PromptConfig; // Renamed to Evaluator Prompt in UI, but keeping key for compatibility or renaming it?
  // validation: PromptConfig; // REMOVED
  order_index: number;
}

// Database types helper (if we were mirroring Supabase DB structure closely)
export interface DbStep {
  id: string;
  title: string;
  execution_prompt: string;
  execution_inject_user: boolean;
  evaluator_prompt: string;
  evaluator_inject_user: boolean;
  order_index: number;
  created_at?: string;
}
