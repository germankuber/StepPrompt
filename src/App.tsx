import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type { Step } from './types';
import { normalizeStep } from './types';
import { MainLayout } from './components/MainLayout';
import { ScenarioEditorPage } from './pages/ScenarioEditorPage';
import { SimulationPage } from './pages/SimulationPage';
import { PublicSimulationPage } from './pages/PublicSimulationPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { ConfigPage } from './pages/ConfigPage';
import { SaveModal } from './components/SaveModal';
import { EditScenarioModal } from './components/EditScenarioModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { stepService } from './services/stepService';
import { settingsService } from './services/settingsService';
import { aiService } from './services/aiService';
import { toast } from 'sonner';

function App() {
  const [steps, setSteps] = useState<Step[]>(() => {
    const saved = localStorage.getItem('simulation_steps');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Normalize steps to ensure they have failCondition
      return parsed.map((step: Partial<Step>) => normalizeStep(step as any));
    }
    return [];
  });
  const [genericExecutionPrompt, setGenericExecutionPrompt] = useState(() => localStorage.getItem('generic_execution_prompt') || '');
  const [genericEvaluatorPrompt, setGenericEvaluatorPrompt] = useState(() => localStorage.getItem('generic_evaluator_prompt') || '');
  const [genericFailPrompt, setGenericFailPrompt] = useState(() => localStorage.getItem('generic_fail_prompt') || '');
  const [loading, setLoading] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stepToDeleteId, setStepToDeleteId] = useState<string | null>(null);
  const [currentScenarioName, setCurrentScenarioName] = useState<string | null>(null);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [apiKey, setApiKey] = useState(() => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    return envKey || localStorage.getItem('openai_api_key') || '';
  });

  const [modelName, setModelName] = useState(() => localStorage.getItem('openai_model_name') || 'gpt-4o-mini');

  // Load settings from DB on mount
  useEffect(() => {
      const loadSettings = async () => {
          try {
              const [savedKey, savedModel] = await Promise.all([
                  settingsService.getSetting('openai_api_key'),
                  settingsService.getSetting('openai_model_name')
              ]);
              
              // Use env var first, then DB, then empty string for API key
              const envKey = import.meta.env.VITE_OPENAI_API_KEY;
              if (envKey || savedKey) {
                  setApiKey(envKey || savedKey || '');
              }
              
              // Load model from DB
              if (savedModel) {
                  setModelName(savedModel);
              }
          } catch (error) {
              console.error("Failed to load settings", error);
          }
      };
      loadSettings();
  }, []);

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
    localStorage.setItem('generic_fail_prompt', genericFailPrompt);
  }, [genericFailPrompt]);
  
  const handleApiKeyChange = (newKey: string) => {
      setApiKey(newKey);
      // Don't auto-save to DB, wait for save button
  };

  // Wrap load/save handlers to use hooks if needed or keep them simple
  // We need a component to use useNavigate
  
  return (
    <BrowserRouter>
      <AppRoutes 
        steps={steps}
        setSteps={setSteps}
        genericExecutionPrompt={genericExecutionPrompt}
        setGenericExecutionPrompt={setGenericExecutionPrompt}
        genericEvaluatorPrompt={genericEvaluatorPrompt}
        setGenericEvaluatorPrompt={setGenericEvaluatorPrompt}
        genericFailPrompt={genericFailPrompt}
        setGenericFailPrompt={setGenericFailPrompt}
        apiKey={apiKey}
        setApiKey={handleApiKeyChange}
        modelName={modelName}
        setModelName={setModelName}
        loading={loading}
        setLoading={setLoading}
        isSaveModalOpen={isSaveModalOpen}
        setIsSaveModalOpen={setIsSaveModalOpen}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        editingScenarioId={editingScenarioId}
        setEditingScenarioId={setEditingScenarioId}
        editingScenarioName={editingScenarioName}
        setEditingScenarioName={setEditingScenarioName}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        stepToDeleteId={stepToDeleteId}
        setStepToDeleteId={setStepToDeleteId}
        currentScenarioName={currentScenarioName}
        setCurrentScenarioName={setCurrentScenarioName}
        currentScenarioId={currentScenarioId}
        setCurrentScenarioId={setCurrentScenarioId}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
    </BrowserRouter>
  );
}

// Inner component to use hooks like useNavigate
const AppRoutes = (props: any) => {
  const navigate = useNavigate();
  const {
    steps, setSteps, 
    genericExecutionPrompt, setGenericExecutionPrompt,
    genericEvaluatorPrompt, setGenericEvaluatorPrompt,
    genericFailPrompt, setGenericFailPrompt,
    apiKey, setApiKey, modelName, setModelName,
    loading, setLoading,
    isSaveModalOpen, setIsSaveModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    editingScenarioId, setEditingScenarioId,
    editingScenarioName, setEditingScenarioName,
    isDeleteModalOpen, setIsDeleteModalOpen,
    stepToDeleteId, setStepToDeleteId,
    currentScenarioName, setCurrentScenarioName,
    currentScenarioId, setCurrentScenarioId,
    isSidebarCollapsed, setIsSidebarCollapsed
  } = props;

  const handleLoadScenario = async (scenarioId: string, name: string) => {
    setLoading(true);
    try {
        const loadedSteps = await stepService.getStepsForScenario(scenarioId);
        // Normalize steps to ensure they have failCondition
        const normalizedSteps = loadedSteps.map(step => normalizeStep(step));
        setSteps(normalizedSteps);
        
        const scenarioDetails = await stepService.getScenarioById(scenarioId);
        if (scenarioDetails) {
            setGenericExecutionPrompt(scenarioDetails.generic_execution_prompt || '');
            setGenericEvaluatorPrompt(scenarioDetails.generic_evaluator_prompt || ''); 
            setGenericFailPrompt(scenarioDetails.generic_fail_prompt || '');
        }

        setCurrentScenarioName(name);
        setCurrentScenarioId(scenarioId);
        navigate(`/scenarios/${scenarioId}`);
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
      const scenarioId = await stepService.saveScenario(name, steps, genericExecutionPrompt, genericEvaluatorPrompt, genericFailPrompt);
      setCurrentScenarioName(name);
      setCurrentScenarioId(scenarioId);
      toast.success(`Scenario "${name}" saved!`);
      setIsSaveModalOpen(false);
      navigate(`/scenarios/${scenarioId}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save scenario', {
          description: 'Did you run the database migration?'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOverwriteScenario = async () => {
    if (!currentScenarioId || !currentScenarioName) {
      toast.error('No scenario loaded to overwrite');
      return;
    }

    setLoading(true);
    try {
      await stepService.updateScenario(
        currentScenarioId,
        currentScenarioName,
        steps,
        genericExecutionPrompt,
        genericEvaluatorPrompt,
        genericFailPrompt
      );
      toast.success(`Scenario "${currentScenarioName}" updated!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update scenario', {
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
          navigate('/');
          setTimeout(() => navigate('/scenarios'), 50); 
      } catch (error) {
          toast.error('Failed to rename scenario');
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteStep = () => {
    if (stepToDeleteId) {
        setSteps(steps.filter((s: Step) => s.id !== stepToDeleteId));
        toast.info('Step deleted');
        setStepToDeleteId(null);
    }
  };

  const handleSaveSettings = async () => {
      setLoading(true);
      try {
          await Promise.all([
              settingsService.saveSetting('openai_api_key', apiKey),
              settingsService.saveSetting('openai_model_name', modelName)
          ]);
          toast.success('Settings saved to database!');
      } catch (error) {
          console.error("Failed to save settings", error);
          toast.error("Failed to save settings to database");
      } finally {
          setLoading(false);
      }
  };

  const handleExecuteStep = async (message: string, step: Step, history: Array<{ role: string, content: string }>) => {
      if (!apiKey.trim()) {
          const errorMsg = "OpenAI API Key is missing";
          toast.error(errorMsg, { description: "Please check settings in top right." });
          throw new Error(errorMsg);
      }
      
      const mergedStep = {
          ...step,
          execution: {
              ...step.execution,
              content: `${genericExecutionPrompt ? `[GLOBAL CONTEXT]\n${genericExecutionPrompt}\n\n` : ''}${step.execution.content}`
          }
      };

      return await aiService.executeStep(message, mergedStep, apiKey.trim(), modelName, history);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={
          <MainLayout 
            isSidebarCollapsed={isSidebarCollapsed} 
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            onSave={currentScenarioId ? handleOverwriteScenario : () => setIsSaveModalOpen(true)}
            onSaveNew={() => setIsSaveModalOpen(true)}
            loading={loading}
            currentScenarioName={currentScenarioName}
            currentScenarioId={currentScenarioId}
          >
            {/* Outlet renders child routes */}
          </MainLayout>
        }>
          <Route index element={
            <ScenarioEditorPage 
              steps={steps}
              setSteps={setSteps}
              genericExecutionPrompt={genericExecutionPrompt}
              setGenericExecutionPrompt={setGenericExecutionPrompt}
              genericEvaluatorPrompt={genericEvaluatorPrompt}
              setGenericEvaluatorPrompt={setGenericEvaluatorPrompt}
              genericFailPrompt={genericFailPrompt}
              setGenericFailPrompt={setGenericFailPrompt}
              onDeleteStep={(id) => {
                setStepToDeleteId(id);
                setIsDeleteModalOpen(true);
              }}
            />
          } />
          <Route path="scenarios/:scenarioId" element={
            <ScenarioEditorPage 
              steps={steps}
              setSteps={setSteps}
              genericExecutionPrompt={genericExecutionPrompt}
              setGenericExecutionPrompt={setGenericExecutionPrompt}
              genericEvaluatorPrompt={genericEvaluatorPrompt}
              setGenericEvaluatorPrompt={setGenericEvaluatorPrompt}
              genericFailPrompt={genericFailPrompt}
              setGenericFailPrompt={setGenericFailPrompt}
              onDeleteStep={(id) => {
                setStepToDeleteId(id);
                setIsDeleteModalOpen(true);
              }}
              onLoadScenario={handleLoadScenario}
              setCurrentScenarioName={setCurrentScenarioName}
              setCurrentScenarioId={setCurrentScenarioId}
            />
          } />
          <Route path="simulation/:scenarioId?" element={
            <SimulationPage 
              steps={steps}
              setSteps={setSteps}
              onExecute={handleExecuteStep}
              genericEvaluatorPrompt={genericEvaluatorPrompt}
              setGenericEvaluatorPrompt={setGenericEvaluatorPrompt}
              genericFailPrompt={genericFailPrompt}
              setGenericFailPrompt={setGenericFailPrompt}
              setGenericExecutionPrompt={setGenericExecutionPrompt}
              onLoadScenario={handleLoadScenario}
              setCurrentScenarioName={setCurrentScenarioName}
              setCurrentScenarioId={setCurrentScenarioId}
              modelName={modelName}
            />
          } />
          <Route path="scenarios" element={
            <ScenariosPage 
              onLoadScenario={handleLoadScenario}
              onEditName={openEditModal}
            />
          } />
          <Route path="config" element={
            <ConfigPage 
              apiKey={apiKey}
              setApiKey={setApiKey}
              modelName={modelName}
              setModelName={setModelName}
              onSave={handleSaveSettings}
              loading={loading}
            />
          } />
        </Route>
        {/* Public route without MainLayout */}
        <Route path="simulation/public/:scenarioId" element={<PublicSimulationPage />} />
      </Routes>

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
    </>
  );
};

export default App;
