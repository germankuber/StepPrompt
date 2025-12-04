import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationRunner } from '../components/SimulationRunner';
import type { Step } from '../types';
import { normalizeStep } from '../types';
import { stepService } from '../services/stepService';
import { toast } from 'sonner';
import { aiService } from '../services/aiService';

export const PublicSimulationPage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [steps, setSteps] = useState<Step[]>([]);
  const [genericEvaluatorPrompt, setGenericEvaluatorPrompt] = useState('');
  const [genericFailPrompt, setGenericFailPrompt] = useState('');
  const [genericExecutionPrompt, setGenericExecutionPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState(() => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    return envKey || localStorage.getItem('openai_api_key') || '';
  });
  const [modelName, setModelName] = useState(() => localStorage.getItem('openai_model_name') || 'gpt-4o-mini');

  useEffect(() => {
    const loadScenario = async () => {
      if (!scenarioId) {
        toast.error('Scenario ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
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
      <SimulationRunner 
        steps={steps} 
        onExecute={handleExecuteStep}
        genericEvaluatorPrompt={genericEvaluatorPrompt}
        genericFailPrompt={genericFailPrompt}
      />
    </div>
  );
};

