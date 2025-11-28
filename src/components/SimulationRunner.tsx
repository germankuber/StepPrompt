import React, { useState, useRef, useEffect } from 'react';
import type { Step } from '../types';
import { Send, PlayCircle, Bot, User, CheckCircle, XCircle, Gavel, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '../services/aiService';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SimulationRunnerProps {
  steps: Step[];
  onExecute: (message: string, step: Step) => Promise<string>;
}

type SimulationState = 'idle' | 'running_step' | 'waiting_for_eval' | 'running_eval' | 'reviewing_eval';

export const SimulationRunner: React.FC<SimulationRunnerProps> = ({ steps, onExecute }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [simState, setSimState] = useState<SimulationState>('idle');
  const [lastAiResponse, setLastAiResponse] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Helper to get API key from storage (duplication from App.tsx, ideally context/prop but keeping simple)
  const getApiKey = () => import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '';
  const getModel = () => localStorage.getItem('openai_model_name') || 'gpt-4o-mini';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, evalResult, simState]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input;
    setInput('');

    // FLOW 1: Execute Step
    if (simState === 'idle') {
        setSimState('running_step');
        setMessages(prev => [...prev, { role: 'user', content: userInput }]);

        try {
            const response = await onExecute(userInput, currentStep);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setLastAiResponse(response);
            setSimState('waiting_for_eval'); // Move to Eval state
        } catch (error) {
            setMessages(prev => [...prev, { role: 'system', content: 'Error: ' + String(error) }]);
            setSimState('idle');
        }
    } 
    // FLOW 2: Evaluate Response
    else if (simState === 'waiting_for_eval') {
        if (!lastAiResponse) return; // Should not happen

        setSimState('running_eval');
        // Note: We do NOT add the eval prompt to the chat history as requested
        
        try {
            const apiKey = getApiKey();
            const model = getModel();
            
            const result = await aiService.evaluateResponse(
                lastAiResponse, 
                userInput, 
                currentStep, 
                apiKey, 
                model
            );
            
            setEvalResult(result);
            setSimState('reviewing_eval');
        } catch (error) {
            toast.error("Evaluation failed: " + String(error));
            setSimState('waiting_for_eval');
        }
    }
  };

  const handleNextStep = () => {
      if (!isLastStep) {
          setCurrentStepIndex(prev => prev + 1);
          // Reset state for next step
          setSimState('idle');
          setLastAiResponse(null);
          setEvalResult(null);
          setInput('');
          setMessages(prev => [...prev, { 
              role: 'system', 
              content: `--- Moving to Step ${currentStepIndex + 2}: ${steps[currentStepIndex + 1].title} ---` 
          }]);
      } else {
          toast.success("Simulation Completed!");
      }
  };

  const handleRetryEval = () => {
      setSimState('waiting_for_eval');
      setEvalResult(null);
      setInput(''); // Clear input to let user type new criteria
  };

  if (!currentStep) {
      return <div className="p-8 text-center text-gray-500">No steps defined to execute.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white shadow-sm border-l border-gray-200 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
        <div>
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <PlayCircle className="w-6 h-6 text-green-600" />
                Simulation Runner
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                Step {currentStepIndex + 1}: <span className="font-semibold text-blue-600">{currentStep.title}</span>
                {simState === 'waiting_for_eval' && <span className="ml-2 text-orange-600 font-medium">• Waiting for Evaluation</span>}
            </p>
        </div>
        <div className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-500 font-mono">
            {simState === 'idle' && 'Ready for Input'}
            {simState === 'running_step' && 'Executing...'}
            {simState === 'waiting_for_eval' && 'Evaluation Phase'}
            {simState === 'reviewing_eval' && 'Decision Phase'}
        </div>
      </div>

      {/* Context Panel */}
      <div className="bg-blue-50/50 p-3 border-b text-sm text-gray-600 px-6 truncate flex-shrink-0">
        <span className="font-bold text-blue-700">Context:</span> {currentStep.execution.content.substring(0, 150)}...
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 pb-32">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 opacity-60">
                <Bot className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Ready to start simulation</p>
                <p className="text-sm">Send a message to begin execution of {currentStep.title}</p>
            </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-2xl text-base shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-sm' 
                : msg.role === 'system'
                ? 'bg-gray-200 text-gray-600 text-xs font-mono py-2'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
            }`}>
               {msg.role !== 'system' && (
                   <div className="flex items-center gap-2 mb-2 opacity-80 text-xs font-bold uppercase tracking-wide">
                     {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                     <span>{msg.role}</span>
                   </div>
               )}
               <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {(simState === 'running_step' || simState === 'running_eval') && (
            <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                    <div className="flex gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        {simState === 'running_step' ? 'Generating response...' : 'Evaluating...'}
                    </span>
                </div>
            </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Evaluation Result Overlay (Only when reviewing) */}
      {simState === 'reviewing_eval' && evalResult && (
          <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 p-6 z-30 animate-in slide-in-from-bottom-10">
              <div className="max-w-4xl mx-auto">
                  <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                          <Gavel className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg mb-1">Evaluation Result</h3>
                          <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg text-gray-800 text-sm leading-relaxed max-h-40 overflow-y-auto">
                              {evalResult}
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-2">
                      <button 
                          onClick={handleRetryEval}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                          <XCircle className="w-4 h-4" />
                          Retry Evaluation
                      </button>
                      <button 
                          onClick={handleNextStep}
                          disabled={isLastStep}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm flex items-center gap-2"
                      >
                          {isLastStep ? 'Finish Simulation' : 'Approve & Next Step'}
                          <ArrowRight className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Input Area (Hidden during review) */}
      {simState !== 'reviewing_eval' && (
        <div className="p-6 bg-white border-t shadow-lg z-20">
            <div className="w-full">
                {simState === 'waiting_for_eval' && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-orange-600 font-medium animate-pulse">
                        <CheckCircle className="w-4 h-4" />
                        Please enter criteria to evaluate the AI's response above:
                    </div>
                )}
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={simState === 'waiting_for_eval' ? "E.g. 'Did it include a formal greeting?'" : "Type your message here..."}
                        className={clsx(
                            "flex-1 border rounded-xl px-6 py-4 text-lg outline-none shadow-sm transition-all",
                            simState === 'waiting_for_eval' 
                                ? "border-orange-300 focus:ring-2 focus:ring-orange-500 bg-orange-50/30" 
                                : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                        )}
                        disabled={simState === 'running_step' || simState === 'running_eval'}
                        autoFocus
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || simState === 'running_step' || simState === 'running_eval'}
                        className={clsx(
                            "text-white p-4 rounded-xl transition-colors shadow-md flex-shrink-0",
                            simState === 'waiting_for_eval' ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {simState === 'waiting_for_eval' ? <Gavel className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
