import React, { useState, useEffect, useCallback } from 'react';
import { ColumnMappingTemplate, ClientConfigTemplate, UserColumnMapping, Client, Book, Industry } from '../types';
import * as dataService from '../services/dataService';
import { XCircleIcon, TrashIcon } from './icons';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: 'columnMapping' | 'clientConfig';
  onLoadTemplate?: (template: ColumnMappingTemplate | ClientConfigTemplate) => void;
  currentMapping?: UserColumnMapping;
  currentClientConfig?: { client: Client, books: Book[], industry?: Industry };
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  templateType,
  onLoadTemplate,
  currentMapping,
  currentClientConfig
}) => {
  const [columnTemplates, setColumnTemplates] = useState<ColumnMappingTemplate[]>([]);
  const [clientTemplates, setClientTemplates] = useState<ClientConfigTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const loadTemplates = useCallback(() => {
    if (templateType === 'columnMapping') {
      setColumnTemplates(dataService.getColumnMappingTemplates());
    } else {
      setClientTemplates(dataService.getClientConfigTemplates());
    }
  }, [templateType]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      setFeedback({ type: 'error', message: 'Template name is required' });
      return;
    }

    try {
      if (templateType === 'columnMapping' && currentMapping) {
        // Determine if this is for training data (we'll need to pass this info)
        const isTrainingData = Object.keys(currentMapping).some(key =>
          key.includes('chartOfAccount') || key.includes('vendorCustomerName')
        );

        const template = dataService.saveColumnMappingTemplate({
          name: newTemplateName.trim(),
          description: newTemplateDescription.trim() || undefined,
          isTrainingData,
          mapping: currentMapping
        });

        setColumnTemplates(prev => [...prev, template]);
        setFeedback({ type: 'success', message: 'Column mapping template saved successfully' });
      } else if (templateType === 'clientConfig' && currentClientConfig) {
        const template = dataService.saveClientConfigTemplate({
          name: newTemplateName.trim(),
          description: newTemplateDescription.trim() || undefined,
          client: currentClientConfig.client,
          books: currentClientConfig.books,
          industry: currentClientConfig.industry
        });

        setClientTemplates(prev => [...prev, template]);
        setFeedback({ type: 'success', message: 'Client configuration template saved successfully' });
      }

      setShowSaveDialog(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save template' });
    }
  };

  const handleLoadTemplate = (template: ColumnMappingTemplate | ClientConfigTemplate) => {
    if (onLoadTemplate) {
      onLoadTemplate(template);
    }

    // Update usage statistics
    if (templateType === 'columnMapping') {
      dataService.updateColumnMappingTemplateUsage(template.id);
    } else {
      dataService.updateClientConfigTemplateUsage(template.id);
    }

    onClose();
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (templateType === 'columnMapping') {
      dataService.deleteColumnMappingTemplate(templateId);
      setColumnTemplates(prev => prev.filter(t => t.id !== templateId));
    } else {
      dataService.deleteClientConfigTemplate(templateId);
      setClientTemplates(prev => prev.filter(t => t.id !== templateId));
    }
    setFeedback({ type: 'success', message: 'Template deleted successfully' });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (!isOpen) return null;

  const templates = templateType === 'columnMapping' ? columnTemplates : clientTemplates;
  const canSaveCurrent = (templateType === 'columnMapping' && currentMapping) ||
                        (templateType === 'clientConfig' && currentClientConfig);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-borderNeutral">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-textPrimary">
              {templateType === 'columnMapping' ? 'Column Mapping Templates' : 'Client Configuration Templates'}
            </h2>
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-textPrimary"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {feedback && (
            <div className={`mb-4 p-4 rounded-lg text-sm border ${
              feedback.type === 'success'
                ? 'bg-green-700 bg-opacity-30 border-green-500 text-green-100'
                : 'bg-red-700 bg-opacity-30 border-red-500 text-red-100'
            }`}>
              {feedback.message}
              <button
                onClick={() => setFeedback(null)}
                className="ml-4 text-lg font-bold float-right leading-none"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <p className="text-textSecondary">
              {templateType === 'columnMapping'
                ? 'Save and reuse column mappings for different file formats'
                : 'Save and reuse client configurations with books and industries'
              }
            </p>
            {canSaveCurrent && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md transition-colors"
              >
                Save Current as Template
              </button>
            )}
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8 text-textSecondary">
              <p>No templates saved yet.</p>
              <p className="text-sm mt-2">
                {canSaveCurrent
                  ? 'Click "Save Current as Template" to create your first template.'
                  : 'Complete a configuration first, then save it as a template.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <div key={template.id} className="border border-borderNeutral rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-textPrimary">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-textSecondary mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-textSecondary">
                        <span>Created: {formatDate(template.createdAt)}</span>
                        {template.lastUsed && <span>Last used: {formatDate(template.lastUsed)}</span>}
                        <span>Used: {template.usageCount} times</span>
                        {templateType === 'columnMapping' && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            (template as ColumnMappingTemplate).isTrainingData
                              ? 'bg-blue-700 text-blue-100'
                              : 'bg-green-700 text-green-100'
                          }`}>
                            {(template as ColumnMappingTemplate).isTrainingData ? 'Training Data' : 'Processing Data'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="px-3 py-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 text-textSecondary hover:text-red-400 transition-colors"
                        title="Delete template"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-textPrimary mb-4">Save Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="block w-full p-2 border border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary bg-slate-700 text-textPrimary"
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      rows={3}
                      className="block w-full p-2 border border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary bg-slate-700 text-textPrimary"
                      placeholder="Describe when to use this template"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setNewTemplateName('');
                      setNewTemplateDescription('');
                    }}
                    className="px-4 py-2 text-textSecondary hover:text-textPrimary font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md transition-colors"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;