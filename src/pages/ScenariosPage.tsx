import React from 'react';
import { SavedScenariosList } from '../components/SavedScenariosList';

interface ScenariosPageProps {
  onLoadScenario: (id: string, name: string) => void;
  onEditName: (id: string, name: string) => void;
}

export const ScenariosPage: React.FC<ScenariosPageProps> = ({
  onLoadScenario,
  onEditName
}) => {
  return (
    <div className="h-full">
        <SavedScenariosList 
            onLoadScenario={onLoadScenario} 
            onEditName={onEditName}
        />
    </div>
  );
};

