import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Globe, Plus, Box } from 'lucide-react';
import { StepEditor } from '../components/StepEditor';
import { GenericPromptsModal } from '../components/GenericPromptsModal';
import type { Step } from '../types';
import { normalizeStep } from '../types';
import { stepService } from '../services/stepService';
import { toast } from 'sonner';

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

interface ScenarioEditorPageProps {
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  genericExecutionPrompt: string;
  setGenericExecutionPrompt: (val: string) => void;
  genericEvaluatorPrompt: string;
  setGenericEvaluatorPrompt: (val: string) => void;
  genericFailPrompt: string;
  setGenericFailPrompt: (val: string) => void;
  onDeleteStep: (id: string) => void;
  onLoadScenario?: (scenarioId: string, name: string) => Promise<void>;
  setCurrentScenarioName?: (name: string | null) => void;
  setCurrentScenarioId?: (id: string | null) => void;
}

export const ScenarioEditorPage: React.FC<ScenarioEditorPageProps> = ({
  steps,
  setSteps,
  genericExecutionPrompt,
  setGenericExecutionPrompt,
  genericEvaluatorPrompt,
  setGenericEvaluatorPrompt,
  genericFailPrompt,
  setGenericFailPrompt,
  onDeleteStep,
  onLoadScenario,
  setCurrentScenarioName,
  setCurrentScenarioId
}) => {
  const { scenarioId } = useParams<{ scenarioId?: string }>();
  const [isGenericPromptsModalOpen, setIsGenericPromptsModalOpen] = useState(false);
  const [lastLoadedScenarioId, setLastLoadedScenarioId] = useState<string | null>(null);

  useEffect(() => {
    // Load scenario from URL if scenarioId is provided and different from last loaded
    if (scenarioId && scenarioId !== lastLoadedScenarioId && onLoadScenario && setCurrentScenarioName && setCurrentScenarioId) {
      const loadScenarioFromUrl = async () => {
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
        }
      };
      loadScenarioFromUrl();
    } else if (!scenarioId && lastLoadedScenarioId) {
      // If no scenarioId in URL but we had one loaded, reset
      setLastLoadedScenarioId(null);
      if (setCurrentScenarioName) setCurrentScenarioName(null);
      if (setCurrentScenarioId) setCurrentScenarioId(null);
    }
  }, [scenarioId, lastLoadedScenarioId, setSteps, setGenericExecutionPrompt, setGenericEvaluatorPrompt, setGenericFailPrompt, setCurrentScenarioName, setCurrentScenarioId, onLoadScenario]);

  const updateStep = (updatedStep: Step) => {
    setSteps(steps.map(s => s.id === updatedStep.id ? updatedStep : s));
  };

  const addStep = () => {
    const newStep: Step = {
      id: generateId(),
      title: `Step ${steps.length + 1}`,
      order_index: steps.length,
      execution: { content: '', injectUserMessage: false },
      successCondition: { content: '', injectUserMessage: false },
      failCondition: { content: '', injectUserMessage: false },
      information: '',
    };
    setSteps([...steps, newStep]);
  };

  return (
    <div className="h-full">
        <div className="space-y-6 pb-20">
            
            {/* Generic Prompts Button */}
            <button
                onClick={() => setIsGenericPromptsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
                <Globe className="w-5 h-5" />
                Generic Prompts
            </button>

            {steps.map((step, index) => (
                <StepEditor 
                    key={step.id} 
                    step={{...step, order_index: index}} 
                    onUpdate={updateStep}
                    onDelete={onDeleteStep}
                />
            ))}

            {steps.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="flex justify-center mb-4">
                        <Box className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Start a new scenario</h3>
                    <p className="text-gray-500 mb-6">Define your first execution step to get started.</p>
                    <button 
                        onClick={addStep}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add First Step
                    </button>
                </div>
            )}

            {steps.length > 0 && (
                <button 
                    onClick={addStep}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add Next Step
                </button>
            )}
        </div>

        <GenericPromptsModal
          isOpen={isGenericPromptsModalOpen}
          onClose={() => setIsGenericPromptsModalOpen(false)}
          genericExecutionPrompt={genericExecutionPrompt}
          setGenericExecutionPrompt={setGenericExecutionPrompt}
          genericEvaluatorPrompt={genericEvaluatorPrompt}
          setGenericEvaluatorPrompt={setGenericEvaluatorPrompt}
          genericFailPrompt={genericFailPrompt}
          setGenericFailPrompt={setGenericFailPrompt}
        />
    </div>
  );
};

