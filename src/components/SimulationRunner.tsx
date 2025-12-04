import React, { useState, useRef, useEffect } from 'react';
import type { Step } from '../types';
import { Send, PlayCircle, Bot, User, Gavel, RotateCcw, Info, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '../services/aiService';
import { ResetConfirmationModal } from './ResetConfirmationModal';

// TypeScript types for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  stepTitle?: string;
  stepIndex?: number; // Store the step index to show correct information
}

interface SimulationRunnerProps {
  steps: Step[];
  onExecute: (message: string, step: Step, history: Array<{ role: string, content: string }>) => Promise<string>;
  genericEvaluatorPrompt?: string;
  genericFailPrompt?: string;
  isPublic?: boolean;
  apiKey?: string;
  modelName?: string;
}

type SimulationState = 'idle' | 'running_step' | 'waiting_for_eval' | 'running_eval' | 'reviewing_eval';

export const SimulationRunner: React.FC<SimulationRunnerProps> = ({ steps, onExecute, genericEvaluatorPrompt, genericFailPrompt, isPublic = false, apiKey: propApiKey, modelName: propModelName }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [simState, setSimState] = useState<SimulationState>('idle');
  const [lastAiResponse, setLastAiResponse] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<string | null>(null);
  // Store the user's evaluation criteria message to add it to history later
  const [lastUserEvalCriteria, setLastUserEvalCriteria] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Voice mode state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const finalTranscriptRef = useRef<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use steps directly as passed from App.tsx to respect the user's visual order
  // Do NOT sort by order_index as it might be stale/buggy
  const sortedSteps = steps;

  const currentStep = sortedSteps[currentStepIndex];
  const isLastStep = currentStepIndex === sortedSteps.length - 1;

  // Helper to get API key from props, env, or storage (prefer props for public mode)
  const getApiKey = () => {
    if (propApiKey) return propApiKey;
    return import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '';
  };
  const getModel = () => {
    if (propModelName) return propModelName;
    return localStorage.getItem('openai_model_name') || 'gpt-4o-mini';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, evalResult, simState]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (isPublic && isVoiceMode) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES'; // Spanish, can be changed to 'en-US' for English

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let newFinalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            if (result.isFinal) {
              newFinalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update final transcript ref (accumulated final results)
          if (newFinalTranscript) {
            finalTranscriptRef.current += newFinalTranscript;
          }
          
          // Update display transcript (final + interim for live preview)
          setTranscript(finalTranscriptRef.current + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech') {
            // This is normal when user stops talking
            return;
          }
          toast.error('Error en reconocimiento de voz: ' + event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        toast.error('Tu navegador no soporta reconocimiento de voz');
        setIsVoiceMode(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isPublic, isVoiceMode]);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording && simState !== 'running_step' && simState !== 'running_eval') {
      setIsRecording(true);
      setTranscript('');
      finalTranscriptRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      // Wait a bit for final transcript, then send
      setTimeout(() => {
        const textToSend = finalTranscriptRef.current.trim() || transcript.trim();
        if (textToSend && simState !== 'running_step' && simState !== 'running_eval') {
          handleSend(textToSend);
        }
        setTranscript('');
        finalTranscriptRef.current = '';
      }, 500);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const messageToSend = textToSend || input;
    if (!messageToSend.trim()) return;

    const userInput = messageToSend;
    setInput('');

    // FLOW 1: Execute Step
    if (simState === 'idle') {
        setSimState('running_step');
        // Note: We use currentStepIndex + 1 to show the chronological step number, avoiding confusion if title is "Step 4"
        const stepLabel = `Step ${currentStepIndex + 1}`;
        setMessages(prev => [...prev, { role: 'user', content: userInput, stepTitle: stepLabel }]);

        try {
            // Pass conversation history (filtering out system messages)
            const history = messages
                .filter(m => m.role === 'user' || m.role === 'assistant')
                .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

            const response = await onExecute(userInput, currentStep, history);
            const stepLabel = `Step ${currentStepIndex + 1}`;
            setMessages(prev => [...prev, { role: 'assistant', content: response, stepTitle: stepLabel, stepIndex: currentStepIndex }]);
            setLastAiResponse(response);
            setSimState('waiting_for_eval'); // Move to Eval state
        } catch (error) {
            const stepLabel = `Step ${currentStepIndex + 1}`;
            setMessages(prev => [...prev, { role: 'system', content: 'Error: ' + String(error), stepTitle: stepLabel }]);
            setSimState('idle');
        }
    } 
    // FLOW 2: Evaluate Response
    else if (simState === 'waiting_for_eval') {
        if (!lastAiResponse) return; // Should not happen

        setSimState('running_eval');
        setLastUserEvalCriteria(userInput); // Store criteria to add to history later if approved
        
        // Add User Message (The feedback/input) IMMEDIATELY
        const stepLabel = `Step ${currentStepIndex + 1}`;
        setMessages(prev => [...prev, { role: 'user', content: userInput, stepTitle: stepLabel }]);
        
        try {
            const apiKey = getApiKey();
            const model = getModel();
            
            // Merge Generic Evaluator Prompt with Step Evaluator Prompt if needed
            const effectiveStep = {
                ...currentStep,
                successCondition: {
                    ...currentStep.successCondition,
                    // We don't need to prepend generic prompt here anymore as it's handled in aiService
                    content: currentStep.successCondition.content
                }
            };

            const result = await aiService.evaluateResponse(
                lastAiResponse, 
                effectiveStep, 
                apiKey, 
                model,
                userInput, // Pass userInput (the feedback) for {{UserMessage}} replacement
                genericEvaluatorPrompt
            );
            
            // Parse the result to check for FAIL
            let isFail = false;
            try {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    isFail = parsed.result === 'FAIL';
                }
            } catch (e) {
                // If parsing fails, assume not fail
            }

            if (isFail) {
                setEvalResult(result); // Store it just in case, though we are auto-advancing
                await executeFailSequence(userInput);
            } else {
                setEvalResult(null); // Clear result since we are auto-advancing
                // Auto-advance to next step
                await handleNextStep(userInput);
            }
        } catch (error) {
            toast.error("Evaluation failed: " + String(error));
            setSimState('waiting_for_eval');
        }
    }
  };

  const executeFailSequence = async (userFeedback: string) => {
      setSimState('running_step');
      
      const stepLabel = `Step ${currentStepIndex + 1}`;
      
      // Note: User feedback message is already added in handleSend before eval started
      
      try {
          const apiKey = getApiKey();
          const model = getModel();
          
          const responseContent = await aiService.handleFailResponse(
              genericFailPrompt || '',
              currentStep,
              userFeedback, 
              lastAiResponse || '',
              apiKey,
              model
          );
          
          // Add the response to messages
          setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: responseContent, 
              stepTitle: stepLabel,
              stepIndex: currentStepIndex 
          }]);
          
          // Clear evaluation state
          setEvalResult(null);
          setLastUserEvalCriteria(null);
          
          // Go back to waiting for eval so user can evaluate the fail response or move on
          setSimState('waiting_for_eval');
          
      } catch (error) {
          toast.error("Error processing fail prompt: " + String(error));
          setSimState('reviewing_eval'); // Fallback to review so they can at least see the result and try "OK" again or Retry
      }
  };

  const handleNextStep = async (userCriteria?: string) => {
      // Use override criteria (from immediate call) or fallback to state
      const criteria = userCriteria || lastUserEvalCriteria;
      
      if (!isLastStep && criteria) {
          const nextIndex = currentStepIndex + 1;
          const nextStep = sortedSteps[nextIndex];
          const textToSend = criteria;

          // 1. Update UI to show we moved
          setCurrentStepIndex(nextIndex);
          
          // Use chronological step number for tags
          const nextStepLabel = `Step ${nextIndex + 1}`;
          
          // Note: The user message (textToSend) was already added to messages when they typed it (in handleSend).
          // However, it was added with the OLD step label. 
          // If we want it to look like it triggered the next step, strictly speaking it's already in the past.
          // But usually we want: [Step 1 System] -> [Step 1 User] -> [Step 1 AI] -> [Step 1 Eval/User] -> [Step 2 AI]
          
          // If we added it in handleSend, it is at the end of the list with Step 1 label.
          // Now we transition. 
          
          setMessages(prev => [
              ...prev, 
              { role: 'system', content: `--- Moving to Step ${nextIndex + 1}: ${nextStep.title} ---`, stepTitle: nextStepLabel }
              // We DO NOT add user message here again because it was added in handleSend
          ]);
          
          // 2. Clear Eval state
          setSimState('running_step'); // Go straight to running
          setLastAiResponse(null);
          setEvalResult(null);
          setLastUserEvalCriteria(null);
          setInput('');

          try {
              // 3. Execute with NEW step and UPDATED history
              // We need to construct history. 
              // The messages state ALREADY contains the user message we just sent (added in handleSend).
              // So we can just use `messages` (but we need to access the updated state which isn't available in this closure immediately)
              // Actually, React state updates are batched. `messages` here is still the old one?
              // No, handleSend added it, then we waited for eval. So `messages` should contain it.
              
              const currentHistory = messages
                   .filter(m => m.role === 'user' || m.role === 'assistant')
                   .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
              
              // We don't need to manually append textToSend to history if it's already in `messages`.
              // But wait, `messages` in this scope might be stale if we didn't wait for re-render?
              // handleNextStep is called from handleOk (user click) or auto-fail.
              // So `messages` should be up to date with what happened in handleSend.
              
              // Let's verify: handleSend adds message -> awaits eval -> sets simState.
              // User clicks OK -> handleOk -> handleNextStep.
              // So yes, `messages` has the user message.
              
              const updatedHistory = currentHistory; // It already has the latest user message

              const response = await onExecute(textToSend, nextStep, updatedHistory);
              const nextStepLabel = `Step ${nextIndex + 1}`;
              
              setMessages(prev => [...prev, { role: 'assistant', content: response, stepTitle: nextStepLabel, stepIndex: nextIndex }]);
              setLastAiResponse(response);
              setSimState('waiting_for_eval');

          } catch (error) {
              const nextStepLabel = `Step ${nextIndex + 1}`;
              setMessages(prev => [...prev, { role: 'system', content: 'Error: ' + String(error), stepTitle: nextStepLabel }]);
              setSimState('idle');
          }
      } else if (isLastStep) {
          toast.success("Simulation Completed!");
      }
  };

  const handleOk = async () => {
      // Logic for PASS scenario
      setEvalResult(null);
      setLastUserEvalCriteria(null);
      handleNextStep();
  };

  const handleReset = () => {
      setCurrentStepIndex(0);
      setMessages([]);
      setInput('');
      setSimState('idle');
      setLastAiResponse(null);
      setEvalResult(null);
      setLastUserEvalCriteria(null);
      toast.info("Simulation restarted");
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
        <div className="flex items-center gap-3">
            <div className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-500 font-mono">
                {simState === 'idle' && 'Ready for Input'}
                {simState === 'running_step' && 'Executing...'}
                {simState === 'waiting_for_eval' && 'Evaluation Phase'}
                {simState === 'reviewing_eval' && 'Decision Phase'}
            </div>
            <button
                onClick={() => setIsResetModalOpen(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Restart Simulation"
            >
                <RotateCcw className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Context Panel */}
      <div className="bg-blue-50/50 p-3 border-b text-sm text-gray-600 px-6 truncate flex-shrink-0">
        <span className="font-bold text-blue-700">Context:</span> {currentStep.execution.content.substring(0, 150)}...
      </div>

      {/* Information Alert - Top of Chat - Only show after AI responds for this step */}
      {currentStep?.information && currentStep.information.trim() !== '' && 
       messages.some(msg => msg.role === 'assistant' && msg.stepIndex === currentStepIndex) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mx-6 mt-4 rounded-lg shadow-sm flex-shrink-0">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-yellow-800">Information</h3>
                <span className="text-orange-600 font-bold">!</span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {currentStep.information}
              </div>
            </div>
          </div>
        </div>
      )}

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
                     {msg.stepTitle && (
                       <span className="ml-auto text-xs font-normal normal-case bg-black/10 px-2 py-0.5 rounded-full">
                         {msg.stepTitle}
                       </span>
                     )}
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

      {/* Evaluation Result Popup Modal */}
      {simState === 'reviewing_eval' && evalResult && (() => {
          // Try to parse JSON from evalResult
          let parsedResult: { result?: string; reasons?: string[] } | null = null;
          try {
              // Try to extract JSON from the result (it might be wrapped in text)
              const jsonMatch = evalResult.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                  parsedResult = JSON.parse(jsonMatch[0]);
              }
          } catch (e) {
              // If parsing fails, keep parsedResult as null
          }

          const isFail = parsedResult?.result === 'FAIL' && parsedResult?.reasons && parsedResult.reasons.length > 0;

          return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-gray-200">
                      <div className="flex justify-between items-center mb-4 border-b pb-3">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                                  <Gavel className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-gray-800 text-xl">Evaluation Result</h3>
                          </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-100 p-5 rounded-lg text-gray-800 text-base leading-relaxed mb-6 max-h-[60vh] overflow-y-auto shadow-inner">
                          {isFail ? (
                              <div>
                                  <div className="font-semibold text-red-700 mb-3">FAIL</div>
                                  <ul className="list-disc list-inside space-y-2">
                                      {parsedResult!.reasons!.map((reason, idx) => (
                                          <li key={idx} className="text-gray-700">{reason}</li>
                                      ))}
                                  </ul>
                              </div>
                          ) : (
                              <div className="whitespace-pre-wrap">{evalResult}</div>
                          )}
                      </div>
                  
                      <div className="flex justify-end gap-3 pt-2">
                          <button 
                              onClick={handleOk}
                              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-lg flex items-center gap-2 transform hover:scale-105 active:scale-95"
                          >
                              OK
                          </button>
                      </div>
                  </div>
              </div>
          );
      })()}

      {/* Input Area (Hidden during review - technically underneath the modal now, but kept hidden for cleaner state) */}
      {simState !== 'reviewing_eval' && (
        <div className="p-6 bg-white border-t shadow-lg z-20">
            <div className="w-full">
              {/* Voice Mode Toggle (only in public mode) */}
              {isPublic && (
                <div className="flex items-center justify-center mb-4">
                  <button
                    onClick={() => setIsVoiceMode(!isVoiceMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isVoiceMode 
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {isVoiceMode ? 'Modo Voz Activado' : 'Activar Modo Voz'}
                    </span>
                  </button>
                </div>
              )}

              {/* Voice Mode UI */}
              {isPublic && isVoiceMode ? (
                <div className="flex flex-col items-center gap-4">
                  {/* Transcript Display */}
                  {transcript && (
                    <div className="w-full bg-purple-50 border border-purple-200 rounded-xl px-6 py-4 text-lg text-gray-800 min-h-[60px] flex items-center">
                      {transcript}
                    </div>
                  )}
                  
                  {/* Record Button */}
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={simState === 'running_step' || simState === 'running_eval'}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Mantén presionado para grabar"
                  >
                    {isRecording ? (
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Mic className="w-6 h-6 text-red-500" />
                      </div>
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-500 text-center">
                    {isRecording ? 'Grabando... Suelta para enviar' : 'Mantén presionado para hablar'}
                  </p>
                </div>
              ) : (
                /* Text Input Mode */
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && input.trim() && simState !== 'running_step' && simState !== 'running_eval') {
                        handleSend();
                      }
                    }}
                    placeholder="Type your message here..."
                    className="flex-1 border border-gray-300 rounded-xl px-6 py-4 text-lg outline-none shadow-sm transition-all focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || simState === 'running_step' || simState === 'running_eval'}
                    className="text-white p-4 rounded-xl transition-colors shadow-md flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
        </div>
      )}

      <ResetConfirmationModal 
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={handleReset}
      />
    </div>
  );
};
