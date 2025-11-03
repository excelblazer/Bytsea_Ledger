import React, { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, LightBulbIcon } from './icons';
import { ValidationResult, ValidationIssue, ValidationSuggestion } from '../types';

interface DataValidationPanelProps {
  validationResult: ValidationResult | null;
  isVisible: boolean;
  onApplySuggestion?: (suggestion: ValidationSuggestion) => void;
  onDismissIssue?: (issue: ValidationIssue) => void;
  onClose?: () => void;
}

const DataValidationPanel: React.FC<DataValidationPanelProps> = ({
  validationResult,
  isVisible,
  onApplySuggestion,
  onDismissIssue,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['metrics', 'issues']));

  if (!isVisible || !validationResult) {
    return null;
  }

  const { metrics, issues, suggestions } = validationResult;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getImpactColor = (impact: ValidationSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEffortBadge = (effort: ValidationSuggestion['effort']) => {
    const colors = {
      auto: 'bg-green-100 text-green-800',
      manual: 'bg-yellow-100 text-yellow-800',
      review: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[effort]}`}>
        {effort}
      </span>
    );
  };

  return (
    <div className="bg-white border border-borderNeutral rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-borderNeutral">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-textPrimary">Data Quality Analysis</h3>
            <p className="text-sm text-textSecondary mt-1">
              Review data quality issues and apply suggested improvements
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-textPrimary">{metrics.qualityScore}%</div>
              <div className="text-sm text-textSecondary">Quality Score</div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              metrics.qualityScore >= 80 ? 'bg-green-100' :
              metrics.qualityScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {metrics.qualityScore >= 80 ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : metrics.qualityScore >= 60 ? (
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-600" />
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
              >
                Continue to Mapping
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="border-b border-borderNeutral">
        <button
          onClick={() => toggleSection('metrics')}
          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span className="font-medium text-textPrimary">Quality Metrics</span>
          <span className={`transform transition-transform ${expandedSections.has('metrics') ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {expandedSections.has('metrics') && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.validRows}</div>
                <div className="text-sm text-green-700">Valid Rows</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{issues.filter((i: ValidationIssue) => i.type === 'error').length}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{issues.filter((i: ValidationIssue) => i.type === 'warning').length}</div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{issues.filter((i: ValidationIssue) => i.type === 'info').length}</div>
                <div className="text-sm text-blue-700">Info</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>Duplicates: <span className="font-medium">{metrics.duplicateRows}</span></div>
              <div>Missing Data: <span className="font-medium">{metrics.missingDataRows}</span></div>
              <div>Format Issues: <span className="font-medium">{metrics.invalidFormatRows}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Issues */}
      <div className="border-b border-borderNeutral">
        <button
          onClick={() => toggleSection('issues')}
          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span className="font-medium text-textPrimary">
            Issues ({issues.length})
          </span>
          <span className={`transform transition-transform ${expandedSections.has('issues') ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {expandedSections.has('issues') && (
          <div className="px-6 pb-4 max-h-96 overflow-y-auto">
            {issues.length === 0 ? (
              <div className="text-center py-8 text-textSecondary">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p>No issues found! Your data looks good.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue: ValidationIssue, index: number) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium capitalize">{issue.category.replace('_', ' ')}</span>
                            {issue.rowIndex !== undefined && (
                              <span className="text-xs bg-white px-2 py-1 rounded">
                                Row {issue.rowIndex + 1}
                              </span>
                            )}
                            {issue.field && (
                              <span className="text-xs bg-white px-2 py-1 rounded font-mono">
                                {issue.field}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mb-2">{issue.message}</p>
                          {issue.suggestion && (
                            <p className="text-sm opacity-75">
                              💡 {issue.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {issue.canAutoFix && (
                          <button className="text-xs px-2 py-1 bg-white rounded hover:bg-gray-50 transition-colors">
                            Auto-fix
                          </button>
                        )}
                        {onDismissIssue && (
                          <button
                            onClick={() => onDismissIssue(issue)}
                            className="text-xs px-2 py-1 bg-white rounded hover:bg-gray-50 transition-colors"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('suggestions')}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium text-textPrimary flex items-center">
              <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Suggestions ({suggestions.length})
            </span>
            <span className={`transform transition-transform ${expandedSections.has('suggestions') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          {expandedSections.has('suggestions') && (
            <div className="px-6 pb-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {suggestions.map((suggestion: ValidationSuggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-4 border border-yellow-200 rounded-lg bg-yellow-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-textPrimary">{suggestion.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(suggestion.impact)}`}>
                            {suggestion.impact} impact
                          </span>
                          {getEffortBadge(suggestion.effort)}
                        </div>
                        <p className="text-sm text-textSecondary mb-3">{suggestion.description}</p>
                        {suggestion.preview && (
                          <div className="text-xs bg-white p-2 rounded border font-mono">
                            {suggestion.preview}
                          </div>
                        )}
                      </div>
                      {onApplySuggestion && (
                        <button
                          onClick={() => onApplySuggestion(suggestion)}
                          className="ml-4 px-3 py-2 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataValidationPanel;