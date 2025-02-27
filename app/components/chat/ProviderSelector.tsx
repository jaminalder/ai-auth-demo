"use client";

import { LLMProvider } from "@/app/lib/types";
import { useState, useEffect } from "react";

interface ProviderSelectorProps {
  providers: LLMProvider[];
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string, modelId: string) => void;
}

export default function ProviderSelector({
  providers,
  selectedProvider,
  selectedModel,
  onProviderChange,
}: ProviderSelectorProps) {
  const [currentProvider, setCurrentProvider] = useState(selectedProvider);
  const [currentModel, setCurrentModel] = useState(selectedModel);

  const selectedProviderData = providers.find(p => p.id === currentProvider);

  useEffect(() => {
    // If provider changes, set first model as default
    if (selectedProviderData && (!currentModel || !selectedProviderData.models.includes(currentModel))) {
      setCurrentModel(selectedProviderData.models[0]);
    }
  }, [currentProvider, selectedProviderData, currentModel]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProviderId = e.target.value;
    setCurrentProvider(newProviderId);

    // Get the first model of the new provider
    const newProviderData = providers.find(p => p.id === newProviderId);
    const firstModel = newProviderData?.models[0] || '';
    setCurrentModel(firstModel);

    onProviderChange(newProviderId, firstModel);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setCurrentModel(newModel);
    onProviderChange(currentProvider, newModel);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1">
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
          AI Provider
        </label>
        <select
          id="provider"
          value={currentProvider}
          onChange={handleProviderChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
          Model
        </label>
        <select
          id="model"
          value={currentModel}
          onChange={handleModelChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        >
          {selectedProviderData?.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block sm:self-end sm:mb-1">
        <div className="bg-white px-3 py-2 rounded-md border border-gray-200 text-xs text-gray-500">
          {selectedProviderData?.id === 'anthropic' ? (
            <span>Claude models support tool use</span>
          ) : selectedProviderData?.id === 'openai' ? (
            <span>GPT models support function calling</span>
          ) : (
            <span>Local models have limited tool capabilities</span>
          )}
        </div>
      </div>
    </div>
  );
}
