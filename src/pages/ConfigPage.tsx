import React from 'react';
import { ConfigView } from '../components/ConfigView';

interface ConfigPageProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  modelName: string;
  setModelName: (name: string) => void;
}

export const ConfigPage: React.FC<ConfigPageProps> = ({
  apiKey,
  setApiKey,
  modelName,
  setModelName
}) => {
  return (
    <div className="h-full">
        <ConfigView 
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            activeModel={modelName}
            onModelChange={setModelName}
        />
    </div>
  );
};

