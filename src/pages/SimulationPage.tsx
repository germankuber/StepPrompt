import React from 'react';
import { SimulationRunner } from '../components/SimulationRunner';
import type { Step } from '../types';

interface SimulationPageProps {
  steps: Step[];
  onExecute: (message: string, step: Step, history: Array<{ role: string, content: string }>) => Promise<string>;
  genericEvaluatorPrompt: string;
  genericFailPrompt: string;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  steps,
  onExecute,
  genericEvaluatorPrompt,
  genericFailPrompt
}) => {
  return (
    <div className="h-full">
        <SimulationRunner 
            steps={steps} 
            onExecute={onExecute}
            genericEvaluatorPrompt={genericEvaluatorPrompt}
            genericFailPrompt={genericFailPrompt}
        />
    </div>
  );
};

