import { useState } from 'react';
import { EntityType, RuleFileType } from '../types';
import * as dataService from '../services/dataService';
import * as accountingRulesService from '../services/accountingRulesService';

/**
 * Custom hook for managing application settings and modals
 */
export const useSettingsManager = () => {
  const [isAddEntityModalOpen, setIsAddEntityModalOpen] = useState(false);
  const [entityTypeToAdd, setEntityTypeToAdd] = useState<EntityType | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<'apikey' | 'export' | 'customize' | 'ai' | null>(null);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Import/Export feedback
  const [importExportFeedback, setImportExportFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [ruleCustomizationFeedback, setRuleCustomizationFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Rule statuses
  const [ruleStatuses, setRuleStatuses] = useState({
    accountingRules: false,
    coaValidation: false,
    coaAlternateNames: false,
  });

  const updateRuleStatuses = () => {
    setRuleStatuses({
      accountingRules: !!accountingRulesService.getCustomRuleFile('accountingRules'),
      coaValidation: !!accountingRulesService.getCustomRuleFile('coaValidation'),
      coaAlternateNames: !!accountingRulesService.getCustomRuleFile('coaAlternateNames'),
    });
  };

  const openAddEntityModal = (type: EntityType) => {
    setEntityTypeToAdd(type);
    setIsAddEntityModalOpen(true);
  };

  const closeAddEntityModal = () => {
    setIsAddEntityModalOpen(false);
    setEntityTypeToAdd(null);
  };

  const openSettingsModal = (view?: 'apikey' | 'export' | 'customize' | 'ai') => {
    setSettingsView(view || null);
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
    setSettingsView(null);
  };

  const handleExportTrainingData = () => {
    setImportExportFeedback(null);
    try {
      const exportedData = dataService.exportAllTrainingData();
      const jsonString = JSON.stringify(exportedData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `bytsea_ledger_training_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setImportExportFeedback({ type: 'success', message: 'Training data (including custom rules if any) exported successfully.' });
    } catch (error) {
      console.error("Error exporting training data:", error);
      setImportExportFeedback({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleImportTrainingData = (file: File) => {
    return new Promise<{ summary: string[], errors: string[] }>((resolve) => {
      setImportExportFeedback(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const importedData = JSON.parse(text);
          const result = dataService.importAllTrainingData(importedData);

          let feedbackMessage = result.summary.join(' ');
          if (result.errors.length > 0) {
            feedbackMessage += ` Errors: ${result.errors.join(', ')}`;
            setImportExportFeedback({ type: 'error', message: `Import completed with issues: ${feedbackMessage}` });
          } else {
            setImportExportFeedback({ type: 'success', message: `Import successful: ${feedbackMessage}` });
          }
          resolve(result);
        } catch (error) {
          console.error("Error importing training data:", error);
          const errorMessage = `Import failed: ${error instanceof Error ? error.message : 'Could not parse JSON file.'}`;
          setImportExportFeedback({ type: 'error', message: errorMessage });
          resolve({ summary: [], errors: [errorMessage] });
        }
      };
      reader.onerror = () => {
        const errorMessage = 'Failed to read the import file.';
        setImportExportFeedback({ type: 'error', message: errorMessage });
        resolve({ summary: [], errors: [errorMessage] });
      };
      reader.readAsText(file);
    });
  };

  const handleCustomRuleUpload = (ruleType: RuleFileType, file: File) => {
    return new Promise<void>((resolve) => {
      setRuleCustomizationFeedback(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsedJson = JSON.parse(text);
          accountingRulesService.saveCustomRuleFile(ruleType, parsedJson);
          setRuleCustomizationFeedback({ type: 'success', message: `${ruleType} rules updated successfully.` });
          updateRuleStatuses();
          resolve();
        } catch (error) {
          setRuleCustomizationFeedback({
            type: 'error',
            message: `Failed to upload ${ruleType} rules: ${error instanceof Error ? error.message : 'Invalid JSON format.'}`
          });
          resolve();
        }
      };
      reader.onerror = () => {
        setRuleCustomizationFeedback({ type: 'error', message: `Failed to read ${ruleType} file.` });
        resolve();
      };
      reader.readAsText(file);
    });
  };

  const handleResetSingleRule = (ruleType: RuleFileType) => {
    accountingRulesService.resetCustomRule(ruleType);
    setRuleCustomizationFeedback({ type: 'success', message: `${ruleType} rules reset to default.` });
    updateRuleStatuses();
  };

  const handleResetAllRules = () => {
    accountingRulesService.resetAllCustomRules();
    setRuleCustomizationFeedback({ type: 'success', message: 'All accounting rules reset to application defaults.' });
    updateRuleStatuses();
  };

  return {
    // Modal states
    isAddEntityModalOpen,
    entityTypeToAdd,
    isSettingsModalOpen,
    settingsView,
    isSettingsMenuOpen,
    isPrivacyPolicyOpen,
    isFirstTimeUser,

    // Feedback states
    importExportFeedback,
    ruleCustomizationFeedback,
    ruleStatuses,

    // Modal actions
    openAddEntityModal,
    closeAddEntityModal,
    openSettingsModal,
    closeSettingsModal,
    setIsSettingsMenuOpen,
    setIsPrivacyPolicyOpen,
    setIsFirstTimeUser,

    // Data actions
    handleExportTrainingData,
    handleImportTrainingData,
    handleCustomRuleUpload,
    handleResetSingleRule,
    handleResetAllRules,
    updateRuleStatuses,

    // Clear feedback
    clearImportExportFeedback: () => setImportExportFeedback(null),
    clearRuleCustomizationFeedback: () => setRuleCustomizationFeedback(null),

    // Set feedback (for internal use)
    setImportExportFeedback,
    setRuleCustomizationFeedback
  };
};