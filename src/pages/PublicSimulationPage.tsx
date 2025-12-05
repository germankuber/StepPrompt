import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationRunner } from '../components/SimulationRunner';
import type { Step } from '../types';
import { normalizeStep } from '../types';
import { stepService } from '../services/stepService';
import { settingsService } from '../services/settingsService';
import { toast, Toaster } from 'sonner';
import { aiService } from '../services/aiService';

export const PublicSimulationPage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [steps, setSteps] = useState<Step[]>([]);
  const [genericEvaluatorPrompt, setGenericEvaluatorPrompt] = useState('');
  const [genericFailPrompt, setGenericFailPrompt] = useState('');
  const [genericExecutionPrompt, setGenericExecutionPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>('');
  const [modelName, setModelName] = useState<string>('gpt-4o-mini');

  useEffect(() => {
    const loadScenario = async () => {
      if (!scenarioId) {
        toast.error('Scenario ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load API key and model from database (not localStorage)
        const [savedApiKey, savedModelName] = await Promise.all([
          settingsService.getSetting('openai_api_key'),
          settingsService.getSetting('openai_model_name')
        ]);

        // Use env var first, then DB, then empty string
        const envKey = import.meta.env.VITE_OPENAI_API_KEY;
        setApiKey(envKey || savedApiKey || '');
        setModelName(savedModelName || 'gpt-4o-mini');

        // Load scenario steps and details
        const loadedSteps = await stepService.getStepsForScenario(scenarioId);
        const normalizedSteps = loadedSteps.map(step => normalizeStep(step));
        setSteps(normalizedSteps);
        
        const scenarioDetails = await stepService.getScenarioById(scenarioId);
        if (scenarioDetails) {
          setGenericExecutionPrompt(scenarioDetails.generic_execution_prompt || '');
          setGenericEvaluatorPrompt(scenarioDetails.generic_evaluator_prompt || ''); 
          setGenericFailPrompt(scenarioDetails.generic_fail_prompt || '');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load scenario');
      } finally {
        setLoading(false);
      }
    };

    loadScenario();
  }, [scenarioId]);

  const handleExecuteStep = async (message: string, step: Step, history: Array<{ role: string, content: string }>) => {
    if (!apiKey.trim()) {
      const errorMsg = "OpenAI API Key is missing";
      toast.error(errorMsg, { description: "Please check settings." });
      throw new Error(errorMsg);
    }
    
    const mergedStep = {
      ...step,
      execution: {
        ...step.execution,
        content: `${genericExecutionPrompt ? `[GLOBAL CONTEXT]\n${genericExecutionPrompt}\n\n` : ''}${step.execution.content}`
      }
    };

    return await aiService.executeStep(message, mergedStep, apiKey.trim(), modelName, history);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading scenario...</div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">No scenario found</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Toaster 
        position="bottom-right" 
        richColors 
        expand={true}
        gap={12}
        visibleToasts={10}
        toastOptions={{
          style: {
            marginBottom: '8px',
          },
        }}
      />
      <SimulationRunner 
        steps={steps} 
        onExecute={handleExecuteStep}
        genericEvaluatorPrompt={genericEvaluatorPrompt}
        genericFailPrompt={genericFailPrompt}
        isPublic={true}
        apiKey={apiKey}
        modelName={modelName}
      />
    </div>
  );
};

