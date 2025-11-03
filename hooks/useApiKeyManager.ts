import { useState, useEffect } from 'react';
import * as geminiService from '../services/geminiService';

/**
 * Custom hook for managing Gemini API key and AI preferences
 */
export const useApiKeyManager = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyNeeded, setIsApiKeyNeeded] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(false);
  const [useAI, setUseAI] = useState<boolean>(false);

  useEffect(() => {
    // Load API key and AI preference from localStorage
    const savedApiKey = localStorage.getItem('geminiApiKey');
    const savedUseAI = localStorage.getItem('useAI') === 'true';

    if (savedApiKey) {
      handleSaveApiKey(savedApiKey);
    }

    setUseAI(savedUseAI);
    setIsApiKeyNeeded(false); // AI is now optional
  }, []);

  const handleSaveApiKey = async (newKey: string) => {
    setApiKeyLoading(true);
    setApiKeyError(null);

    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = geminiService.initializeAiClient(newKey);
    if (success) {
      localStorage.setItem('geminiApiKey', newKey);
      setApiKey(newKey);
      setIsApiKeyNeeded(false);
    } else {
      setApiKeyError("Failed to initialize Gemini client. Please check your API key.");
      setIsApiKeyNeeded(true);
      localStorage.removeItem('geminiApiKey');
      setApiKey(null);
    }
    setApiKeyLoading(false);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('geminiApiKey');
    setApiKey(null);
    geminiService.initializeAiClient('');
    setIsApiKeyNeeded(true);
    setApiKeyError(null);
  };

  const toggleUseAI = (enabled: boolean) => {
    setUseAI(enabled);
    localStorage.setItem('useAI', enabled.toString());
  };

  return {
    apiKey,
    isApiKeyNeeded,
    apiKeyError,
    apiKeyLoading,
    useAI,
    handleSaveApiKey,
    handleClearApiKey,
    toggleUseAI,
    setApiKeyError
  };
};