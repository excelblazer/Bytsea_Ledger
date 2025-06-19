
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-textPrimary p-4">
      <div className="w-full max-w-md bg-surface shadow-xl rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-center text-primary mb-3">Google Gemini API Key</h2>
        <p className="text-sm text-textSecondary text-center mb-6">
          Enter your API key to enable AI-powered transaction categorization.
        </p>

        {currentError && (
          <div className="mb-4 p-3 bg-red-700 bg-opacity-30 border border-red-500 rounded-md text-sm text-red-100">
            {currentError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-textSecondary sr-only">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your API key..."
              className="mt-1 block w-full px-4 py-3 bg-slate-700 border border-borderNeutral rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-textPrimary placeholder-placeholderText text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!apiKeyInput.trim() || isLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary disabled:bg-neutral-dark disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <CogIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Verifying...
              </>
            ) : (
              'Save API Key'
            )}
          </button>
          {hasExistingKey && onClearKey && (
            <button
              onClick={onClearKey}
              disabled={isLoading}
              className="w-full px-6 py-3 border border-borderNeutral text-sm font-medium rounded-md shadow-sm text-textSecondary hover:bg-slate-700 hover:text-textPrimary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-borderFocus disabled:opacity-50 transition-colors"
            >
              Clear Saved Key & Enter New One
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-light hover:text-primary hover:underline"
          >
            Get an API Key from Google AI Studio
          </a>
        </div>
        <p className="mt-4 text-xs text-textSecondary opacity-70 text-center">
          Your API key is stored only in your browser's local storage and is used to communicate directly with Google's Gemini API. It is not sent to our servers.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySetup;
