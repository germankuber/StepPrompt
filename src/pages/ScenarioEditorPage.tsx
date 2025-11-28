import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, Play, Box, Plus } from 'lucide-react';
import { StepEditor } from '../components/StepEditor';
import type { Step } from '../types';

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

interface ScenarioEditorPageProps {
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  genericExecutionPrompt: string;
  setGenericExecutionPrompt: (val: string) => void;
  genericEvaluatorPrompt: string;
  setGenericEvaluatorPrompt: (val: string) => void;
  onDeleteStep: (id: string) => void;
}

export const ScenarioEditorPage: React.FC<ScenarioEditorPageProps> = ({
  steps,
  setSteps,
  genericExecutionPrompt,
  setGenericExecutionPrompt,
  genericEvaluatorPrompt,
  setGenericEvaluatorPrompt,
  onDeleteStep
}) => {
  const [isGlobalConfigExpanded, setIsGlobalConfigExpanded] = useState(false);

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
    };
    setSteps([...steps, newStep]);
  };

  return (
    <div className="h-full">
        <div className="space-y-6 pb-20">
            
            {/* Global Configuration Section */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div 
                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors bg-blue-50/30"
                    onClick={() => setIsGlobalConfigExpanded(!isGlobalConfigExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-800 text-sm">Global Configuration (Generic Prompts)</h3>
                    </div>
                    <div className="text-gray-400">
                        {isGlobalConfigExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
                
                {isGlobalConfigExpanded && (
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                <Play className="w-3 h-3" /> Generic Execution Prompt
                            </label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 font-mono text-xs"
                                value={genericExecutionPrompt}
                                onChange={(e) => setGenericExecutionPrompt(e.target.value)}
                                placeholder="Context that applies to ALL steps (prepended to step context)..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                <Box className="w-3 h-3" /> Generic Evaluator Prompt
                            </label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 font-mono text-xs"
                                value={genericEvaluatorPrompt}
                                onChange={(e) => setGenericEvaluatorPrompt(e.target.value)}
                                placeholder="Evaluation rules that apply to ALL steps (prepended to evaluator criteria)..."
                            />
                        </div>
                    </div>
                )}
            </div>

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
    </div>
  );
};

