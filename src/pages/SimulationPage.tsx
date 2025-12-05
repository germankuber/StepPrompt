import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationRunner } from '../components/SimulationRunner';
import type { Step } from '../types';
import { normalizeStep } from '../types';
import { stepService } from '../services/stepService';
import { toast } from 'sonner';

interface SimulationPageProps {
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  onExecute: (message: string, step: Step, history: Array<{ role: string, content: string }>) => Promise<string>;
  genericEvaluatorPrompt: string;
  setGenericEvaluatorPrompt: (val: string) => void;
  genericFailPrompt: string;
  setGenericFailPrompt: (val: string) => void;
  setGenericExecutionPrompt: (val: string) => void;
  onLoadScenario: (scenarioId: string, name: string) => Promise<void>;
  setCurrentScenarioName: (name: string | null) => void;
  setCurrentScenarioId: (id: string | null) => void;
  modelName?: string;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  steps,
  setSteps,
  onExecute,
  genericEvaluatorPrompt,
  setGenericEvaluatorPrompt,
  genericFailPrompt,
  setGenericFailPrompt,
  setGenericExecutionPrompt,
  setCurrentScenarioName,
  setCurrentScenarioId,
  modelName
}) => {
  const { scenarioId } = useParams<{ scenarioId?: string }>();
  const [loading, setLoading] = useState(false);
  const [lastLoadedScenarioId, setLastLoadedScenarioId] = useState<string | null>(null);

  useEffect(() => {
    // Load scenario from URL if scenarioId is provided and different from last loaded
    if (scenarioId && scenarioId !== lastLoadedScenarioId) {
      const loadScenarioFromUrl = async () => {
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
            setCurrentScenarioName(scenarioDetails.name);
            setCurrentScenarioId(scenarioId);
          }
          setLastLoadedScenarioId(scenarioId);
        } catch (error) {
          console.error(error);
          toast.error('Failed to load scenario from URL');
        } finally {
          setLoading(false);
        }
      };
      loadScenarioFromUrl();
    } else if (!scenarioId) {
      // If no scenarioId in URL, reset the last loaded ID
      setLastLoadedScenarioId(null);
    }
  }, [scenarioId, lastLoadedScenarioId, setSteps, setGenericExecutionPrompt, setGenericEvaluatorPrompt, setGenericFailPrompt, setCurrentScenarioName, setCurrentScenarioId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading scenario...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
        <SimulationRunner 
            steps={steps} 
            onExecute={onExecute}
            genericEvaluatorPrompt={genericEvaluatorPrompt}
            genericFailPrompt={genericFailPrompt}
            modelName={modelName}
        />
    </div>
  );
};

