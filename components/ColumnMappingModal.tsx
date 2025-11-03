import React, { useState, useEffect } from 'react';
import { TargetFieldConfigItem, ColumnMappingTemplate, ClientConfigTemplate, UserColumnMapping } from '../types';
import TemplateManager from './TemplateManager';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvHeaders: string[];
  sampleData: string[][];
  onSaveMapping: (mapping: Record<string, string>) => void;
  fileName: string;
  clientName?: string;
  bookName?: string;
  targetFields: TargetFieldConfigItem[];
  modalTitle: string;
}

const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  csvHeaders,
  sampleData,
  onSaveMapping,
  fileName,
  clientName,
  bookName,
  targetFields,
  modalTitle
}) => {
  const [currentMapping, setCurrentMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialMapping: Record<string, string> = {};
       targetFields.forEach(field => {
        const fieldKey = field.key as string;
        const normalizedFieldLabel = field.label.toLowerCase().replace(/[^a-z0-9]/gi, '');
        const normalizedFieldKeyLower = fieldKey.toLowerCase();

        const foundHeader = csvHeaders.find(h => {
            const normalizedHeader = h.toLowerCase().replace(/[^a-z0-9]/gi, '');
            if (normalizedHeader === normalizedFieldLabel) return true;
            if (normalizedHeader.includes(normalizedFieldKeyLower)) return true;
            if (normalizedFieldKeyLower.includes("description") && normalizedHeader.includes("memo")) return true;
            if (normalizedFieldKeyLower.includes("desc") && normalizedHeader.includes("memo")) return true;
            return false;
        });
        
        if (foundHeader) {
          initialMapping[fieldKey] = foundHeader;
        }
      });
      setCurrentMapping(initialMapping);
      setError(null);
    }
  }, [isOpen, csvHeaders, targetFields]);

  const handleSelectChange = (targetFieldKey: string, csvHeader: string) => {
    setCurrentMapping(prev => {
      const newMapping = { ...prev };
      if (csvHeader) {
        newMapping[targetFieldKey] = csvHeader;
      } else {
        delete newMapping[targetFieldKey];
      }
      return newMapping;
    });
    if(error) setError(null);
  };

  const handleSave = () => {
    setError(null);
    const missingMandatoryLabels: string[] = [];
    
    targetFields.forEach(field => {
        const fieldKey = field.key as string;
        if (field.mandatory && !currentMapping[fieldKey]) {
            if (field.group === 'amountHandling') return; 
            missingMandatoryLabels.push(field.label);
        }
    });

    const amountFieldsInConfig = targetFields.filter(f => f.group === 'amountHandling');
    const singleAmountField = amountFieldsInConfig.find(f => (f.key as string).toLowerCase().includes('amount') && !(f.key as string).toLowerCase().includes('debit') && !(f.key as string).toLowerCase().includes('credit'));
    const debitAmountField = amountFieldsInConfig.find(f => (f.key as string).toLowerCase().includes('debit'));
    const creditAmountField = amountFieldsInConfig.find(f => (f.key as string).toLowerCase().includes('credit'));

    const singleAmountMapped = singleAmountField && !!currentMapping[singleAmountField.key as string];
    const debitAmountMapped = debitAmountField && !!currentMapping[debitAmountField.key as string];
    const creditAmountMapped = creditAmountField && !!currentMapping[creditAmountField.key as string];

    const isAmountGroupMandatory = amountFieldsInConfig.some(f => f.mandatory);

    if (isAmountGroupMandatory && !singleAmountMapped && !debitAmountMapped && !creditAmountMapped) {
        const amountLabel = singleAmountField?.label || "Amount";
        if (!missingMandatoryLabels.includes(amountLabel)) {
            missingMandatoryLabels.push(`${amountLabel} (either single column or Debit/Credit)`);
        }
    }
    
    if (singleAmountMapped && (debitAmountMapped || creditAmountMapped)) {
        setError("Please map EITHER a single 'Amount' column OR 'Debit/Credit' columns, but not both types simultaneously.");
        return;
    }

    if (missingMandatoryLabels.length > 0) {
      setError(`Please map all mandatory fields: ${missingMandatoryLabels.join(', ')}.`);
      return;
    }
    
    onSaveMapping(currentMapping);
  };

  const handleLoadTemplate = (template: ColumnMappingTemplate | ClientConfigTemplate) => {
    if ('mapping' in template) {
      setCurrentMapping(template.mapping as unknown as Record<string, string>);
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="bg-surface p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-textPrimary">{modalTitle}</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTemplateManagerOpen(true)}
              className="px-3 py-1 text-sm text-textSecondary hover:text-primary border border-borderNeutral rounded-md transition-colors"
            >
              Templates
            </button>
            <button onClick={onClose} className="text-textSecondary hover:text-textPrimary text-2xl transition-colors">&times;</button>
          </div>
        </div>
        <p className="text-xs text-textSecondary opacity-75 mb-4 italic">
            File: {fileName}
            {clientName && ` | Client: ${clientName}`}
            {bookName && ` | Book: ${bookName}`}
        </p>

        <p className="text-sm text-textSecondary mb-2">
          Map the columns from your uploaded file to the required Bytsea Ledger fields.
        </p>
        {error && <p className="text-red-400 text-xs mb-3 bg-red-800 bg-opacity-30 p-3 rounded-md border border-red-600">{error}</p>}
        
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar"> {/* Added custom-scrollbar if defined */}
            <p className="text-xs text-textSecondary opacity-80 mb-4 p-3 bg-slate-700 rounded-md border border-borderNeutral">
                For 'Amount' fields: map either a single column representing the net transaction amount, OR map separate 'Debit Amount' / 'Credit Amount' columns if your file has them.
                Ensure mandatory fields (marked with *) are mapped.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-4">
            {targetFields.map(field => {
                const fieldKey = field.key as string;
                let displayLabel = field.label;
                if (field.mandatory && field.group !== 'amountHandling') {
                    displayLabel += ' *';
                } else if (field.mandatory && field.group === 'amountHandling') {
                     displayLabel += ' *';
                }

                return (
                <div key={fieldKey}>
                <label htmlFor={fieldKey} className="block text-sm font-medium text-textSecondary mb-1" title={field.info}>
                    {displayLabel}
                </label>
                <select
                    id={fieldKey}
                    value={currentMapping[fieldKey] || ''}
                    onChange={(e) => handleSelectChange(fieldKey, e.target.value)}
                    className="block w-full p-2.5 bg-slate-700 border border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-textPrimary sm:text-sm placeholder-placeholderText"
                >
                    <option value="" className="text-placeholderText">
                       { field.mandatory ? `Select column for ${field.label}*` : `Select column for ${field.label} (Optional)`}
                    </option>
                    {csvHeaders.map(header => (
                    <option key={header} value={header}>{header}</option>
                    ))}
                </select>
                {field.info && <p className="text-xs text-textSecondary opacity-70 mt-1">{field.info}</p>}
                </div>
            )})}
            </div>

            <h3 className="text-md font-semibold text-textPrimary mb-2 mt-6">CSV Sample Data Preview:</h3>
            {sampleData.length > 0 ? (
                <div className="overflow-x-auto border border-borderNeutral rounded-md max-h-60 shadow-inner">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-700 sticky top-0">
                    <tr>
                        {csvHeaders.map((header, index) => (
                        <th key={index} className="px-3 py-2 text-left font-medium text-textSecondary whitespace-nowrap">{header}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-borderNeutral">
                    {sampleData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-700 transition-colors">
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-textSecondary opacity-90 truncate max-w-[150px]" title={cell}>{cell}</td>
                        ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            ) : <p className="text-sm text-textSecondary opacity-75">No sample data to display.</p>}
        </div>

        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-borderNeutral">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-textPrimary bg-neutral-dark hover:bg-slate-600 rounded-md shadow-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm transition-colors"
          >
            Save Mapping & Continue
          </button>
        </div>
      </div>

      <TemplateManager
        isOpen={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        templateType="columnMapping"
        onLoadTemplate={handleLoadTemplate}
        currentMapping={currentMapping as unknown as UserColumnMapping}
      />
    </div>
  );
};

export default ColumnMappingModal;