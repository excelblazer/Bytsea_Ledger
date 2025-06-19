
import React, { useState } from 'react';
import { CogIcon } from './icons'; // Assuming CogIcon can be used for a loading/processing state

interface ApiKeySetupProps {
  onSaveKey: (key: string) => void;
  onClearKey?: () => void;
  currentError: string | null;
  hasExistingKey: boolean;
  isLoading?: boolean;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSaveKey, onClearKey, currentError, hasExistingKey, isLoading }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      onSaveKey(apiKeyInput.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-textPrimary p-4">
      <div className="w-full max-w-xl glass-card p-8 sm:p-10">
        <h2 className="text-2xl font-semibold text-center mb-3">Google Gemini API Key</h2>
        <p className="text-sm text-textSecondary text-center mb-8">
          First, enter your Google Gemini API key to enable transaction extraction.
        </p>

        {currentError && (
          <div className="mb-6 p-3 bg-red-700 bg-opacity-30 border border-red-500 rounded-md text-sm text-red-100">
            {currentError}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-md font-medium mb-2">
              Enter your Google Gemini API Key:
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter API key..."
              className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-borderNeutral rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-textPrimary placeholder-placeholderText"
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={!apiKeyInput.trim() || isLoading}
              className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-800 glass-button hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <CogIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Verifying...
                </>
              ) : (
                'Save API Key'
              )}
            </button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-neutral-light hover:bg-neutral focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary transition-colors"
            >
              Get an API Key
            </a>
          </div>
          {hasExistingKey && onClearKey && (
            <button
              onClick={onClearKey}
              disabled={isLoading}
              className="w-full px-6 py-3 mt-4 border border-borderNeutral text-sm font-medium rounded-md shadow-sm text-textSecondary hover:bg-slate-700 hover:text-textPrimary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-borderFocus disabled:opacity-50 transition-colors"
            >
              Clear Saved Key & Enter New One
            </button>
          )}
        </div>

        <p className="mt-8 text-xs text-textSecondary opacity-80 text-center">
          Your API key is stored only in your browser's local storage and never sent
          to our servers. It is used only to communicate directly with Google's
          Gemini API. You are open to investigate the code and see how it works by
          navigating to the <a href="https://github.com/excelblazer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">repository</a>.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySetup;
