import React, { useState } from 'react';
import type { Step, PromptConfig } from '../types';
import { CheckCircle, Play, User, ChevronDown, ChevronUp } from 'lucide-react';
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
  type: 'execution' | 'successCondition';
  onUpdate: (type: 'execution' | 'successCondition', field: keyof PromptConfig, value: any) => void;
}) => (
  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-blue-600" />
      <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
    </div>
    
    <div className="space-y-2">
      <div>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 font-mono text-xs"
          value={config.content}
          onChange={(e) => onUpdate(type, 'content', e.target.value)}
          placeholder={`Enter ${title.toLowerCase()}...`}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            checked={config.injectUserMessage}
            onChange={(e) => onUpdate(type, 'injectUserMessage', e.target.checked)}
          />
          <span className={clsx("text-xs", config.injectUserMessage ? "text-blue-700 font-medium" : "text-gray-500")}>
            Inject User Message
          </span>
        </label>
        {config.injectUserMessage && <User className="w-3.5 h-3.5 text-blue-500" />}
      </div>
    </div>
  </div>
);

export const StepEditor: React.FC<StepEditorProps> = ({ step, onUpdate, onDelete, isExpanded: initialExpanded, onToggleExpand }) => {
  
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

  const updatePrompt = (key: 'execution' | 'successCondition', field: keyof PromptConfig, value: any) => {
    onUpdate({
      ...step,
      [key]: {
        ...step[key],
        [field]: value,
      },
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
                {step.order_index + 1}
            </span>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input 
                    type="text" 
                    value={step.title}
                    onChange={(e) => onUpdate({...step, title: e.target.value})}
                    className="text-base font-bold text-gray-800 bg-transparent border-none focus:ring-0 hover:bg-gray-100 rounded px-2 py-0.5"
                />
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
            onClick={(e) => {
                e.stopPropagation();
                onDelete(step.id);
            }}
            className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
            title="Delete Step"
            >
             <User className="w-0 h-0 hidden" /> {/* Hack to keep import but Trash icon is better if imported */}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PromptSection 
                title="Execution Context" 
                icon={Play} 
                config={step.execution} 
                type="execution"
                onUpdate={updatePrompt}
                />
                <PromptSection 
                title="Evaluator Prompt" 
                icon={CheckCircle} 
                config={step.successCondition} 
                type="successCondition" 
                onUpdate={updatePrompt}
                />
            </div>
        </div>
      )}
    </div>
  );
};
