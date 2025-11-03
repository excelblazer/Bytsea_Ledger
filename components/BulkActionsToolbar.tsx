import React from 'react';
import { AccountingCategory } from '../types';

interface BulkActionsToolbarProps {
  selectedCount: number;
  bulkCategoryOverride: string;
  onBulkCategoryChange: (category: string) => void;
  onClearSelection: () => void;
  specificCoaOptions: { specificName: string, broadCategory: AccountingCategory, isSubCategory: boolean }[];
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  bulkCategoryOverride,
  onBulkCategoryChange,
  onClearSelection,
  specificCoaOptions
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-slate-700 p-4 border-b border-borderNeutral">
      <div className="flex items-center justify-between">
        <div className="text-sm text-textSecondary">
          {selectedCount} transaction{selectedCount !== 1 ? 's' : ''} selected
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={bulkCategoryOverride}
            onChange={(e) => onBulkCategoryChange(e.target.value)}
            className="block p-2 border border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-600 text-textPrimary"
          >
            <option value="">Select category for bulk override</option>
            {specificCoaOptions.map(opt => (
              <option key={opt.specificName} value={opt.specificName}>
                {opt.specificName} ({opt.broadCategory})
              </option>
            ))}
          </select>
          <button
            onClick={() => onBulkCategoryChange(bulkCategoryOverride)}
            disabled={!bulkCategoryOverride}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply to Selected
          </button>
          <button
            onClick={onClearSelection}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-textSecondary font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-sm"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;