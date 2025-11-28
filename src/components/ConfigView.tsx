import React, { useState, useEffect } from 'react';
import { Key, Database, Plus, Trash2, Check, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigViewProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  activeModel: string;
  onModelChange: (model: string) => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  apiKey,
  onApiKeyChange,
  activeModel,
  onModelChange,
}) => {
  const [customModels, setCustomModels] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_models');
    return saved ? JSON.parse(saved) : [];
  });
  const [newModelInput, setNewModelInput] = useState('');
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const defaultModels = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ];

  useEffect(() => {
    localStorage.setItem('custom_models', JSON.stringify(customModels));
  }, [customModels]);
  
  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSaveApiKey = async () => {
    onApiKeyChange(localApiKey);
    toast.success('API Key saved!');
  };

  const handleAddModel = () => {
    if (!newModelInput.trim()) return;
    
    if (customModels.includes(newModelInput.trim()) || defaultModels.some(m => m.value === newModelInput.trim())) {
      toast.error('Model already exists');
      return;
    }

    setCustomModels([...customModels, newModelInput.trim()]);
    setNewModelInput('');
    toast.success('Model added');
  };

  const handleDeleteModel = (modelToDelete: string) => {
    setCustomModels(customModels.filter(m => m !== modelToDelete));
    if (activeModel === modelToDelete) {
        onModelChange(defaultModels[0].value);
    }
    toast.success('Model removed');
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50">
      <div className="w-full py-8 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Configuration
        </h2>

      <div className="space-y-8">
        {/* API Key Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-500" />
            OpenAI API Key
          </h3>
          <div className="max-w-xl">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key (Persistent)
            </label>
            <div className="flex gap-2">
                <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    Save
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your API key is stored locally in your browser. We do not send it to any server other than OpenAI.
            </p>
          </div>
        </div>

        {/* Models Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" />
            Model Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Model
              </label>
              <div className="space-y-2">
                {defaultModels.map((model) => (
                  <label 
                    key={model.value}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      activeModel === model.value 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="activeModel"
                        value={model.value}
                        checked={activeModel === model.value}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{model.label}</span>
                    </div>
                    {activeModel === model.value && <Check className="w-4 h-4 text-blue-600" />}
                  </label>
                ))}

                {customModels.map((model) => (
                  <label 
                    key={model}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      activeModel === model 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="activeModel"
                        value={model}
                        checked={activeModel === model}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeModel === model && <Check className="w-4 h-4 text-blue-600" />}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteModel(model);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove Model"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Add New */}
            <div className="bg-gray-50 p-4 rounded-lg h-fit">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add Custom Model</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newModelInput}
                  onChange={(e) => setNewModelInput(e.target.value)}
                  placeholder="e.g. gpt-4-32k"
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddModel()}
                />
                <button
                  onClick={handleAddModel}
                  className="p-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the model ID as provided by OpenAI (e.g. "gpt-4-1106-preview").
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
