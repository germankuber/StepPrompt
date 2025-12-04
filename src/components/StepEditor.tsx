import React, { useState } from 'react';
import type { Step, PromptConfig } from '../types';
import { normalizeStep } from '../types';
import { CheckCircle, Play, ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import { HighlightedTextarea } from './HighlightedTextarea';
import clsx from 'clsx';

interface StepEditorProps {
  step: Step;
  onUpdate: (step: Step) => void;
  onDelete: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Move PromptSection outside to prevent re-mounting on every render
const PromptSection = ({ 
  title, 
  icon: Icon, 
  config, 
  type,
  onUpdate
}: { 
  title: string; 
  icon: React.ElementType; 
  config: PromptConfig; 
  type: 'execution' | 'successCondition' | 'failCondition';
  onUpdate: (type: 'execution' | 'successCondition' | 'failCondition', field: keyof PromptConfig, value: any) => void;
}) => {
  const iconColor = type === 'failCondition' ? 'text-orange-600' : 'text-blue-600';
  return (
  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
    </div>
    
    <div>
      <HighlightedTextarea
        value={config.content}
        onChange={(value) => onUpdate(type, 'content', value)}
        placeholder={`Enter ${title.toLowerCase()}...`}
        className="h-24"
        rows={6}
      />
    </div>
  </div>
  );
};

export const StepEditor: React.FC<StepEditorProps> = ({ step, onUpdate, onDelete, isExpanded: initialExpanded, onToggleExpand }) => {
  // Normalize step to ensure failCondition exists
  const normalizedStep = normalizeStep(step);
  
  // Internal state fallback if parent doesn't control expansion
  const [localExpanded, setLocalExpanded] = useState(initialExpanded ?? true);
  
  const isExpanded = initialExpanded !== undefined ? initialExpanded : localExpanded;
  
  const toggleExpand = () => {
      if (onToggleExpand) {
          onToggleExpand();
      } else {
          setLocalExpanded(!localExpanded);
      }
  };

  const updatePrompt = (key: 'execution' | 'successCondition' | 'failCondition', field: keyof PromptConfig, value: any) => {
    const updatedConfig = {
      ...normalizedStep[key],
      [field]: value,
    };
    
    // Auto-enable injectUserMessage if {{UserMessage}} is detected in content
    if (field === 'content' && typeof value === 'string') {
      const hasUserMessage = value.includes('{{UserMessage}}');
      if (hasUserMessage && !updatedConfig.injectUserMessage) {
        updatedConfig.injectUserMessage = true;
      }
    }
    
    onUpdate({
      ...normalizedStep,
      [key]: updatedConfig,
    });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 transition-all">
      {/* Header - Always visible */}
      <div 
        className={clsx(
            "flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors",
            isExpanded && "border-b border-gray-100"
        )}
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full font-bold text-xs">
                {normalizedStep.order_index + 1}
            </span>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input 
                    type="text" 
                    value={normalizedStep.title}
                    onChange={(e) => onUpdate({...normalizedStep, title: e.target.value})}
                    className="text-base font-bold text-gray-800 bg-transparent border-none focus:ring-0 hover:bg-gray-100 rounded px-2 py-0.5"
                />
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
            onClick={(e) => {
                e.stopPropagation();
                onDelete(normalizedStep.id);
            }}
            className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
            title="Delete Step"
            >
             <span className="text-[10px] font-medium uppercase tracking-wider">Delete</span>
            </button>
            <div className="text-gray-400">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <PromptSection 
                title="Execution Context" 
                icon={Play} 
                config={normalizedStep.execution} 
                type="execution"
                onUpdate={updatePrompt}
                />
                <PromptSection 
                title="Evaluator Prompt" 
                icon={CheckCircle} 
                config={normalizedStep.successCondition} 
                type="successCondition" 
                onUpdate={updatePrompt}
                />
                <PromptSection 
                title="Fail Prompt" 
                icon={AlertTriangle} 
                config={normalizedStep.failCondition} 
                type="failCondition" 
                onUpdate={updatePrompt}
                />
            </div>
            
            {/* Information Field */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-700 text-sm">Information</h3>
                    <span className="text-orange-600 font-bold text-lg">!</span>
                </div>
                <textarea
                    value={normalizedStep.information || ''}
                    onChange={(e) => onUpdate({...normalizedStep, information: e.target.value})}
                    placeholder="Information to display after the AI responds..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs bg-white"
                    rows={4}
                />
            </div>
        </div>
      )}
    </div>
  );
};
