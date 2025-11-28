import { useState, useEffect } from 'react';
import type { Step } from './types';
import { StepEditor } from './components/StepEditor';
import { SimulationRunner } from './components/SimulationRunner';
import { SaveModal } from './components/SaveModal';
import { SavedScenariosList } from './components/SavedScenariosList';
import { EditScenarioModal } from './components/EditScenarioModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { 
  Plus, Save, Loader2, Play, Settings, 
  Layout, List, Box, FlaskConical,
  ChevronLeft, ChevronRight, ArrowLeft, Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { stepService } from './services/stepService';
import { aiService } from './services/aiService';
import { Toaster, toast } from 'sonner';
import clsx from 'clsx';

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

const AVAILABLE_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

function App() {
  const [steps, setSteps] = useState<Step[]>(() => {
    const saved = localStorage.getItem('simulation_steps');
    return saved ? JSON.parse(saved) : [];
  });
  // Generic Prompts State
  const [genericExecutionPrompt, setGenericExecutionPrompt] = useState(() => localStorage.getItem('generic_execution_prompt') || '');
  const [genericEvaluatorPrompt, setGenericEvaluatorPrompt] = useState(() => localStorage.getItem('generic_evaluator_prompt') || '');
  const [isGlobalConfigExpanded, setIsGlobalConfigExpanded] = useState(false);

  const [loading, setLoading] = useState(false);
  // isSimulating is now handled by navigation tab logic primarily, 
  // but we keep state to toggle views
  const [isSimulating, setIsSimulating] = useState(false); 
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  // Edit Scenario State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = useState('');

  // Delete Step State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stepToDeleteId, setStepToDeleteId] = useState<string | null>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<'editor' | 'scenarios' | 'simulation'>('editor');
  const [currentScenarioName, setCurrentScenarioName] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [apiKey, setApiKey] = useState(() => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    return envKey || localStorage.getItem('openai_api_key') || '';
  });

  const [modelName, setModelName] = useState(() => localStorage.getItem('openai_model_name') || 'gpt-4o-mini');

  useEffect(() => {
    localStorage.setItem('simulation_steps', JSON.stringify(steps));
  }, [steps]);

  useEffect(() => {
    localStorage.setItem('generic_execution_prompt', genericExecutionPrompt);
  }, [genericExecutionPrompt]);

  useEffect(() => {
    localStorage.setItem('generic_evaluator_prompt', genericEvaluatorPrompt);
  }, [genericEvaluatorPrompt]);
  
  useEffect(() => {
      if (apiKey && apiKey !== import.meta.env.VITE_OPENAI_API_KEY) {
          localStorage.setItem('openai_api_key', apiKey);
      }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('openai_model_name', modelName);
  }, [modelName]);

  // Effect to handle simulation state when switching tabs manually
  useEffect(() => {
      if (activeTab === 'simulation') {
          setIsSimulating(true);
      } else {
          setIsSimulating(false);
      }
  }, [activeTab]);

  const handleLoadScenario = async (scenarioId: string, name: string) => {
    setLoading(true);
    try {
        // Load steps
        const loadedSteps = await stepService.getStepsForScenario(scenarioId);
        setSteps(loadedSteps);
        
        // Load scenario details (generic prompts)
        const scenarioDetails = await stepService.getScenarioById(scenarioId);
        if (scenarioDetails) {
            setGenericExecutionPrompt(scenarioDetails.generic_execution_prompt || '');
            setGenericEvaluatorPrompt(scenarioDetails.generic_evaluator_prompt || ''); 
        }

        setCurrentScenarioName(name);
        setActiveTab('editor'); // Switch back to editor
        toast.success(`Loaded scenario: ${name}`);
    } catch (error) {
        console.error(error);
        toast.error('Failed to load scenario');
    } finally {
        setLoading(false);
    }
  };

  const handleSaveScenario = async (name: string) => {
    setLoading(true);
    try {
      await stepService.saveScenario(name, steps, genericExecutionPrompt, genericEvaluatorPrompt);
      setCurrentScenarioName(name);
      toast.success(`Scenario "${name}" saved!`);
      setIsSaveModalOpen(false);
      setActiveTab('scenarios'); // Redirect to scenarios list
    } catch (error) {
      console.error(error);
      toast.error('Failed to save scenario', {
          description: 'Did you run the database migration?'
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (id: string, name: string) => {
      setEditingScenarioId(id);
      setEditingScenarioName(name);
      setIsEditModalOpen(true);
  };

  const handleUpdateScenarioName = async (newName: string) => {
      if (!editingScenarioId) return;
      setLoading(true);
      try {
          await stepService.updateScenarioName(editingScenarioId, newName);
          toast.success('Scenario renamed successfully');
          setIsEditModalOpen(false);
          setActiveTab('editor'); 
          setTimeout(() => setActiveTab('scenarios'), 50); 
      } catch (error) {
          toast.error('Failed to rename scenario');
      } finally {
          setLoading(false);
      }
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

  const updateStep = (updatedStep: Step) => {
    setSteps(steps.map(s => s.id === updatedStep.id ? updatedStep : s));
  };

  const confirmDeleteStep = (id: string) => {
      setStepToDeleteId(id);
      setIsDeleteModalOpen(true);
  };

  const handleDeleteStep = () => {
    if (stepToDeleteId) {
        setSteps(steps.filter(s => s.id !== stepToDeleteId));
        toast.info('Step deleted');
        setStepToDeleteId(null);
    }
  };

  // Updated handleExecuteStep to accept history and merge generic prompt
  const handleExecuteStep = async (message: string, step: Step, history: Array<{ role: string, content: string }>) => {
      if (!apiKey.trim()) {
          const errorMsg = "OpenAI API Key is missing";
          toast.error(errorMsg, { description: "Please check settings in top right." });
          throw new Error(errorMsg);
      }
      
      // Merge Generic Execution Prompt with Step Execution Prompt
      const mergedStep = {
          ...step,
          execution: {
              ...step.execution,
              content: `${genericExecutionPrompt ? `[GLOBAL CONTEXT]\n${genericExecutionPrompt}\n\n` : ''}${step.execution.content}`
          }
      };

      // Pass history to aiService
      return await aiService.executeStep(message, mergedStep, apiKey.trim(), modelName, history);
  };

  const startSimulation = () => {
      if (steps.length === 0) {
          toast.error("No steps defined", { description: "Add at least one step to run a simulation." });
          return;
      }
      setActiveTab('simulation');
  };

  const stopSimulation = () => {
      setActiveTab('editor');
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      title={isSidebarCollapsed ? label : undefined}
      className={clsx(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors cursor-pointer relative group",
        active 
          ? "text-white bg-gray-800 border-r-2 border-green-500" 
          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
      )}
    >
      <Icon className={clsx("flex-shrink-0", isSidebarCollapsed ? "w-6 h-6 mx-auto" : "w-5 h-5")} />
      
      {!isSidebarCollapsed && (
          <span>{label}</span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* Sidebar */}
      <aside 
        className={clsx(
            "bg-gray-900 text-white flex flex-col flex-shrink-0 border-r border-gray-800 transition-all duration-300",
            isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={clsx(
            "p-4 border-b border-gray-800 flex items-center",
            isSidebarCollapsed ? "justify-center" : "justify-between px-6"
        )}>
            <div className="flex items-center gap-2 text-green-500 font-bold text-xl overflow-hidden">
                <FlaskConical className="w-6 h-6 flex-shrink-0" />
                {!isSidebarCollapsed && <span>SimStudio</span>}
            </div>
            
            {!isSidebarCollapsed && (
                <button 
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            )}
        </div>

        <nav className="flex-1 py-4 space-y-1">
            <SidebarItem 
                icon={Layout} 
                label="Scenario Editor" 
                active={activeTab === 'editor'} 
                onClick={() => setActiveTab('editor')} 
            />
            <SidebarItem 
                icon={Play} 
                label="Run Simulation" 
                active={activeTab === 'simulation'} 
                onClick={startSimulation} 
            />
            <SidebarItem 
                icon={List} 
                label="Saved Scenarios" 
                active={activeTab === 'scenarios'} 
                onClick={() => setActiveTab('scenarios')} 
            />
        </nav>

        <div className={clsx(
            "p-4 border-t border-gray-800",
            isSidebarCollapsed && "flex justify-center"
        )}>
             {isSidebarCollapsed ? (
                 <button 
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="text-gray-500 hover:text-white transition-colors"
                 >
                    <ChevronRight className="w-5 h-5" />
                 </button>
             ) : (
                 <>
                    <div className="text-xs text-gray-500 mb-2">PROJECT</div>
                    <div className="text-sm font-medium text-gray-300 truncate">Behavior Test</div>
                 </>
             )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
            <div className="flex items-center gap-4">
                {activeTab === 'simulation' && (
                    <button 
                        onClick={stopSimulation}
                        className="p-2 -ml-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        title="Back to Editor"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <h1 className="text-lg font-semibold text-gray-800">
                    {activeTab === 'editor' && (currentScenarioName ? `Editing: ${currentScenarioName}` : 'New Scenario')}
                    {activeTab === 'simulation' && 'Simulation Runner'}
                    {activeTab === 'scenarios' && 'Saved Scenarios'}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Action Buttons (Only visible in Editor) */}
                {activeTab === 'editor' && (
                    <div className="flex items-center gap-2 mr-4 border-r border-gray-200 pr-4">
                        <button 
                            onClick={() => setIsSaveModalOpen(true)}
                            disabled={loading}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Save to Database"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={startSimulation}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-green-50 text-green-600 hover:bg-green-100"
                        >
                            <Play className="w-4 h-4" /> Run
                        </button>
                    </div>
                )}

                {/* Settings Controls (Always visible or maybe hidden in simulation for immersion? Kept for now) */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1.5">
                        <Settings className="w-3.5 h-3.5 text-gray-500" />
                        <select 
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            className="text-xs bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer outline-none p-0"
                        >
                            {AVAILABLE_MODELS.map(model => (
                                <option key={model.value} value={model.value}>{model.label}</option>
                            ))}
                        </select>
                    </div>
                    <input 
                        type="password" 
                        placeholder="API Key" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="text-xs bg-white border border-gray-300 rounded-md px-3 py-1.5 w-32 focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:w-48"
                    />
                </div>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* EDITOR VIEW */}
            {activeTab === 'editor' && (
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
                                onDelete={confirmDeleteStep}
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
            )}

            {/* SIMULATION RUNNER VIEW (Full Screen) */}
            {activeTab === 'simulation' && (
                <div className="h-full">
                    <SimulationRunner 
                        steps={steps} 
                        onExecute={handleExecuteStep}
                        genericEvaluatorPrompt={genericEvaluatorPrompt}
                    />
                </div>
            )}

            {/* SCENARIOS VIEW */}
            {activeTab === 'scenarios' && (
                <SavedScenariosList 
                    onLoadScenario={handleLoadScenario} 
                    onEditName={openEditModal}
                />
            )}

        </div>

        <SaveModal 
            isOpen={isSaveModalOpen} 
            onClose={() => setIsSaveModalOpen(false)} 
            onSave={handleSaveScenario}
            loading={loading}
        />

        <EditScenarioModal 
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleUpdateScenarioName}
            currentName={editingScenarioName}
            loading={loading}
        />

        <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteStep}
            title="Delete Step"
            description="Are you sure you want to delete this step? This action cannot be undone."
        />
      </main>
    </div>
  );
}

export default App;
