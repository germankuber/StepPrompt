import React, { useState, useRef, useEffect } from 'react';
import type { Step } from '../types';
import { Send, PlayCircle, AlertCircle, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SimulationRunnerProps {
  steps: Step[];
  onExecute: (message: string, step: Step) => Promise<string>;
}

export const SimulationRunner: React.FC<SimulationRunnerProps> = ({ steps, onExecute }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentStep) return;

    const userMsg = input;
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      // Execute simulation with current step context
      const response = await onExecute(userMsg, currentStep);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      // If successful response (mock logic for now, ideally we validate here)
      if (!isLastStep) {
         // Optional: Auto-advance or waiting for user manual advance?
         // For now let's just stay on step until user decides or logic dictates
      }
      
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: 'Error executing step: ' + String(error) }]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (!isLastStep) {
        setCurrentStepIndex(prev => prev + 1);
        setMessages(prev => [...prev, { role: 'system', content: `Moved to Step: ${steps[currentStepIndex + 1].title}` }]);
    }
  };

  if (!currentStep) {
      return <div className="p-8 text-center text-gray-500">No steps defined to execute.</div>;
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
        <div>
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-green-600" />
                Simulation Runner
            </h2>
            <p className="text-xs text-gray-500 mt-1">
                Current: <span className="font-semibold text-blue-600">{currentStep.title}</span> 
                ({currentStepIndex + 1}/{steps.length})
            </p>
        </div>
        <button 
            onClick={nextStep} 
            disabled={isLastStep}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 transition-colors font-medium"
        >
            {isLastStep ? 'Simulation Complete' : 'Next Step →'}
        </button>
      </div>

      {/* Context Panel (Optional display of current context) */}
      <div className="bg-blue-50/50 p-2 border-b text-xs text-gray-600 px-4 truncate">
        <span className="font-bold">Context:</span> {currentStep.execution.content.substring(0, 100)}...
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10 text-sm">
                Simulation started. Send a message to begin execution of {currentStep.title}.
            </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : msg.role === 'system'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
               <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                 {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                 <span className="capitalize">{msg.role}</span>
               </div>
               <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message here..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isLoading}
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

