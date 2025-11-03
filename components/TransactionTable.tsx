import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, AccountingCategory, PredictionSourceType } from '../types';
import { getAllSpecificCoANames } from '../services/accountingRulesService';
import ExcelJS from 'exceljs';
import TransactionFilters, { SearchFilters } from './TransactionFilters';
import BulkActionsToolbar from './BulkActionsToolbar';
import TransactionTableHeader from './TransactionTableHeader';
import TransactionRow from './TransactionRow';
import TransactionTableFooter from './TransactionTableFooter';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  jobFileName?: string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onUpdateTransaction, jobFileName }) => {
  const [specificCoaOptions, setSpecificCoaOptions] = useState<{ specificName: string, broadCategory: AccountingCategory, isSubCategory: boolean }[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [bulkCategoryOverride, setBulkCategoryOverride] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    categoryFilter: '',
    predictionSourceFilter: '',
    confidenceMin: 0,
    showOnlyUnreviewed: false
  });

  useEffect(() => {
    setSpecificCoaOptions(getAllSpecificCoANames());
  }, []);

  // Reset selections when transactions change
  useEffect(() => {
    setSelectedTransactions(new Set());
  }, [transactions]);

  // Filter transactions based on search criteria
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Text search
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch = 
          tx.description.toLowerCase().includes(searchLower) ||
          (tx.aiVendorCustomerName || '').toLowerCase().includes(searchLower) ||
          tx.specificCategory.toLowerCase().includes(searchLower) ||
          tx.broadCategory.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date range
      if (filters.dateFrom) {
        if (new Date(tx.date) < new Date(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        if (new Date(tx.date) > new Date(filters.dateTo)) return false;
      }

      // Amount range
      if (filters.amountMin) {
        if (Math.abs(tx.amount) < parseFloat(filters.amountMin)) return false;
      }
      if (filters.amountMax) {
        if (Math.abs(tx.amount) > parseFloat(filters.amountMax)) return false;
      }

      // Category filter
      if (filters.categoryFilter) {
        if (tx.specificCategory !== filters.categoryFilter && tx.broadCategory !== filters.categoryFilter) return false;
      }

      // Prediction source filter
      if (filters.predictionSourceFilter) {
        if (tx.predictionSource !== filters.predictionSourceFilter) return false;
      }

      // Confidence filter
      if (tx.confidenceScore < filters.confidenceMin) return false;

      // Show only unreviewed
      if (filters.showOnlyUnreviewed) {
        if (tx.userOverrideCategory) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  const handleSelectTransaction = (transactionId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (isSelected) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedTransactions(new Set(transactions.map(tx => tx.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleBulkCategoryChange = () => {
    if (!bulkCategoryOverride || selectedTransactions.size === 0) return;
    
    selectedTransactions.forEach(transactionId => {
      onUpdateTransaction(transactionId, { userOverrideCategory: bulkCategoryOverride });
    });
    
    setSelectedTransactions(new Set());
    setBulkCategoryOverride('');
  };

  const handleClearSelection = () => {
    setSelectedTransactions(new Set());
    setBulkCategoryOverride('');
  };

  const getUniquePredictionSources = () => {
    const sources = new Set<string>();
    transactions.forEach(tx => {
      if (tx.predictionSource) sources.add(tx.predictionSource);
    });
    return Array.from(sources).sort();
  };

  const handleCategoryChange = (transactionId: string, newSpecificCategory: string) => {
    onUpdateTransaction(transactionId, { userOverrideCategory: newSpecificCategory });
  };

  const handleExport = async () => {
    const dataToExport = transactions.map(tx => ({
      'Date': tx.date,
      'Transaction Type (AI)': tx.aiTransactionType || '-',
      'Description': tx.description,
      'Chart of Accounts (AI)': tx.specificCategory,
      'Broad Category (AI)': tx.broadCategory,
      'Vendor/Customer Name (AI)': tx.aiVendorCustomerName || '-',
      'Amount': tx.amount,
      'Currency': tx.currency,
      'Prediction Factor': tx.predictionSource || PredictionSourceType.UNKNOWN_SOURCE,
      'Confidence': (tx.confidenceScore * 100).toFixed(0) + '%',
      'Suggested Alternative (AI)': tx.suggestedSpecificCategory ? 
        `${tx.suggestedSpecificCategory}${tx.suggestedBroadCategory && tx.suggestedBroadCategory !== AccountingCategory.UNKNOWN ? ` (${tx.suggestedBroadCategory})` : ''}` 
        : '-',
      'Final Category': tx.userOverrideCategory || tx.specificCategory,
      'Notes': tx.notes || ''
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reviewed Transactions');
    worksheet.columns = Object.keys(dataToExport[0] || {}).map(key => ({ header: key, key, width: Math.min((key.length + 2), 50) }));
    dataToExport.forEach(row => worksheet.addRow(row));
    worksheet.columns.forEach(column => {
      let maxLen = (column as unknown as { header?: string }).header?.length || 0;
      (column as unknown as { eachCell?: Function }).eachCell?.({ includeEmpty: true }, (cell: unknown) => {
        const cellLen = cell && typeof cell === 'object' && 'value' in cell ? String((cell as { value?: unknown }).value || '').length : 0;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      (column as unknown as { width: number }).width = Math.min(maxLen + 2, 50);
    });
    const exportFileName = jobFileName ? `${jobFileName.split('.')[0]}_Reviewed_Transactions.xlsx` : 'Reviewed_Transactions.xlsx';
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = exportFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface shadow-xl rounded-xl overflow-hidden">
      <TransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        specificCoaOptions={specificCoaOptions}
        getUniquePredictionSources={getUniquePredictionSources}
      />

      <BulkActionsToolbar
        selectedCount={selectedTransactions.size}
        bulkCategoryOverride={bulkCategoryOverride}
        onBulkCategoryChange={handleBulkCategoryChange}
        onClearSelection={handleClearSelection}
        specificCoaOptions={specificCoaOptions}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-borderNeutral">
          <TransactionTableHeader
            allSelected={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
            totalTransactions={filteredTransactions.length}
            onSelectAll={handleSelectAll}
          />
          <tbody className="bg-surface divide-y divide-borderNeutral">
            {filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                isSelected={selectedTransactions.has(tx.id)}
                onSelect={handleSelectTransaction}
                onCategoryChange={handleCategoryChange}
                specificCoaOptions={specificCoaOptions}
              />
            ))}
          </tbody>
        </table>
      </div>

      <TransactionTableFooter
        hasTransactions={filteredTransactions.length > 0}
        selectedCount={selectedTransactions.size}
        onClearSelection={handleClearSelection}
        onBulkCategoryChange={handleBulkCategoryChange}
        onExport={handleExport}
      />
    </div>
  );
};

export default TransactionTable;