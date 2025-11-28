import React, { useState } from 'react';
import { X, Edit2 } from 'lucide-react';

interface EditScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  currentName: string;
  loading?: boolean;
}

export const EditScenarioModal: React.FC<EditScenarioModalProps> = ({ isOpen, onClose, onSave, currentName, loading }) => {
  const [name, setName] = useState(currentName);

  // Update internal state when prop changes
  React.useEffect(() => {
      setName(currentName);
  }, [currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name !== currentName) {
      onSave(name);
    } else if (name === currentName) {
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-600" />
            Rename Scenario
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Update Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

