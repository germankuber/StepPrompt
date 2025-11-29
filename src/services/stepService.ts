import { supabase } from '../lib/supabase';
import type { Step, DbStep } from '../types';

// Enhanced types for Scenario support
export interface Scenario {
    id: string;
    name: string;
    created_at: string;
    generic_execution_prompt?: string;
    generic_evaluator_prompt?: string;
}

export const stepService = {
  // Save a new scenario with steps
  async saveScenario(
      name: string, 
      steps: Step[], 
      genericExecutionPrompt?: string, 
      genericEvaluatorPrompt?: string
    ): Promise<string> {
      // 1. Create Scenario
      const { data: scenarioData, error: scenarioError } = await supabase
          .from('scenarios')
          .insert([{ 
              name,
              generic_execution_prompt: genericExecutionPrompt,
              generic_evaluator_prompt: genericEvaluatorPrompt
          }])
          .select()
          .single();
      
      if (scenarioError) throw scenarioError;
      const scenarioId = scenarioData.id;

      // 2. Prepare steps with scenario_id
      const dbSteps = steps.map(step => ({
          ...mapStepToDb(step),
          scenario_id: scenarioId
      }));

      // 3. Insert Steps
      const { error: stepsError } = await supabase
          .from('steps')
          .insert(dbSteps);

      if (stepsError) throw stepsError;

      return scenarioId;
  },
  
  // Update an existing scenario name
  async updateScenarioName(id: string, name: string): Promise<void> {
      const { error } = await supabase
          .from('scenarios')
          .update({ name })
          .eq('id', id);
          
      if (error) throw error;
  },

  // Get all saved scenarios
  async getScenarios(): Promise<Scenario[]> {
      const { data, error } = await supabase
          .from('scenarios')
          .select('*')
          .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
  },

  async getScenarioById(id: string): Promise<Scenario | null> {
      const { data, error } = await supabase
          .from('scenarios')
          .select('*')
          .eq('id', id)
          .single();
      
      if (error) throw error;
      return data;
  },

  // Load steps for a specific scenario
  async getStepsForScenario(scenarioId: string): Promise<Step[]> {
      const { data, error } = await supabase
          .from('steps')
          .select('*')
          .eq('scenario_id', scenarioId)
          .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data as DbStep[]).map(mapDbToStep);
  },

  // Delete a scenario and its steps (cascade handles steps)
  async deleteScenario(scenarioId: string): Promise<void> {
      const { error } = await supabase
          .from('scenarios')
          .delete()
          .eq('id', scenarioId);
          
      if (error) throw error;
  },

  // Legacy / Fallback: Get all steps (could be confusing if mixed with scenarios, kept for safety)
  async getAll(): Promise<Step[]> {
    const { data, error } = await supabase
      .from('steps')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching steps:', error);
      throw error;
    }

    return (data as DbStep[]).map(mapDbToStep);
  },
  
  async saveAll(steps: Step[]): Promise<void> {
    const dbSteps = steps.map(mapStepToDb);

    const { error } = await supabase
      .from('steps')
      .upsert(dbSteps, { onConflict: 'id' });

    if (error) {
      console.error('Error saving steps:', error);
      throw error;
    }
  },
  
  async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('steps')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
  }
};

const mapDbToStep = (db: DbStep): Step => ({
  id: db.id,
  title: db.title,
  order_index: db.order_index,
  execution: {
    content: db.execution_prompt || '',
    injectUserMessage: db.execution_inject_user || false,
  },
  successCondition: {
    content: db.evaluator_prompt || '',
    injectUserMessage: db.evaluator_inject_user || false,
  },
});

const mapStepToDb = (step: Step): DbStep & { scenario_id?: string } => ({
  id: step.id,
  title: step.title,
  order_index: step.order_index,
  execution_prompt: step.execution.content,
  execution_inject_user: step.execution.injectUserMessage,
  evaluator_prompt: step.successCondition.content,
  evaluator_inject_user: step.successCondition.injectUserMessage,
});
