import React, { useEffect, useState } from 'react';
import { Trash2, FolderOpen, Calendar, ArrowRight, Edit2 } from 'lucide-react';
import { stepService, type Scenario } from '../services/stepService';
import { toast } from 'sonner';

interface SavedScenariosListProps {
  onLoadScenario: (scenarioId: string, name: string) => void;
  onEditName: (scenarioId: string, currentName: string) => void;
}

export const SavedScenariosList: React.FC<SavedScenariosListProps> = ({ onLoadScenario, onEditName }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScenarios = async () => {
    try {
      const data = await stepService.getScenarios();
      setScenarios(data);
    } catch (error) {
      toast.error('Failed to load scenarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this scenario? This cannot be undone.')) {
      try {
        await stepService.deleteScenario(id);
        toast.success('Scenario deleted successfully');
        setScenarios(scenarios.filter(s => s.id !== id));
      } catch (error) {
        toast.error('Failed to delete scenario');
      }
    }
  };

  const handleEditClick = (id: string, name: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onEditName(id, name);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading saved scenarios...</div>;
  }

  if (scenarios.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white">
        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No saved scenarios yet</h3>
        <p className="text-gray-500 mt-2">Save your current configuration to see it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenarios.map((scenario) => (
        <div 
          key={scenario.id}
          onClick={() => onLoadScenario(scenario.id, scenario.name)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group relative"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="flex gap-2">
                <button
                onClick={(e) => handleEditClick(scenario.id, scenario.name, e)}
                className="text-gray-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Rename Scenario"
                >
                <Edit2 className="w-4 h-4" />
                </button>
                <button
                onClick={(e) => handleDelete(scenario.id, e)}
                className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Scenario"
                >
                <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors truncate" title={scenario.name}>
            {scenario.name}
          </h3>
          
          <div className="flex items-center text-xs text-gray-500 mb-4">
            <Calendar className="w-3 h-3 mr-1.5" />
            {new Date(scenario.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
            Load Scenario <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      ))}
    </div>
  );
};
