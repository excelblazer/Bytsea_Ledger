import React from 'react';

interface TransactionTableFooterProps {
  hasTransactions: boolean;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkCategoryChange: () => void;
  onExport: () => void;
}

const TransactionTableFooter: React.FC<TransactionTableFooterProps> = ({
  hasTransactions,
  selectedCount,
  onClearSelection,
  onBulkCategoryChange,
  onExport
}) => {
  if (!hasTransactions) {
    return null;
  }

  return (
    <div className="p-4 border-t border-borderNeutral flex justify-between items-center">
      <div className="flex space-x-2">
        <button
          onClick={onClearSelection}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-sm"
        >
          Clear Selection
        </button>
        <button
          onClick={onBulkCategoryChange}
          disabled={selectedCount === 0}
          className={`px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out text-sm ${selectedCount > 0 ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Apply Category Override
        </button>
      </div>
      <button
        onClick={onExport}
        className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-sm"
      >
        Export to Excel (XLSX)
      </button>
    </div>
  );
};

export default TransactionTableFooter;