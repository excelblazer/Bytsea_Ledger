import React, { useState, useEffect } from 'react';
import { Transaction, AccountingCategory, PredictionSourceType } from '../types';
import { getAllSpecificCoANames, normalizeCategoryFromString, getRuleFiles } from '../services/accountingRulesService';
import StatusBadge from './StatusBadge';
import ExcelJS from 'exceljs';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  isLoading?: boolean;
  jobFileName?: string; 
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onUpdateTransaction, isLoading, jobFileName }) => {
  const [specificCoaOptions, setSpecificCoaOptions] = useState<{ specificName: string, broadCategory: AccountingCategory, isSubCategory: boolean }[]>([]);

  useEffect(() => {
    setSpecificCoaOptions(getAllSpecificCoANames());
  }, []);

  if (isLoading) {
    return <div className="text-center p-4 text-textSecondary">Loading transactions...</div>;
  }
  
  if (!transactions || transactions.length === 0) {
    return <div className="text-center p-6 text-textSecondary opacity-75">No transactions to display.</div>;
  }

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
      let maxLen = column.header.length;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellLen = cell.value ? String(cell.value).length : 0;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      column.width = Math.min(maxLen + 2, 50);
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-borderNeutral">
          <thead className="bg-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Date</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Transaction Type (AI)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Description</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Chart of Accounts (AI)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Broad Category (AI)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Vendor/Customer Name (AI)</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Currency</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Prediction Factor</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Confidence</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Suggested Alt. (AI)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">Final Category (Override)</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-borderNeutral">
            {transactions.map((tx) => {
              // Determine the broad category for this transaction's specificCategory
              const rules = getRuleFiles();
              const { broadCategory: txBroadCategory } = normalizeCategoryFromString(tx.specificCategory, rules);
              // Filter options to only those matching the broad category
              const filteredCoaOptions = specificCoaOptions.filter(opt => opt.broadCategory === txBroadCategory);
              return (
                <tr key={tx.id} className="hover:bg-slate-700 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{tx.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{tx.aiTransactionType || '-'}</td>
                  <td className="px-4 py-3 whitespace-normal text-sm text-textSecondary max-w-xs truncate" title={tx.description}>{tx.description}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textPrimary font-medium">{tx.specificCategory}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                     <StatusBadge status={tx.broadCategory} type="category" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary max-w-[150px] truncate" title={tx.aiVendorCustomerName}>{tx.aiVendorCustomerName || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary text-right">{tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{tx.currency}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">{tx.predictionSource || PredictionSourceType.UNKNOWN_SOURCE}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <StatusBadge status="" type="confidence" confidenceScore={tx.confidenceScore} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-textSecondary">
                    {tx.suggestedSpecificCategory ? (
                       `${tx.suggestedSpecificCategory}${tx.suggestedBroadCategory && tx.suggestedBroadCategory !== AccountingCategory.UNKNOWN ? ` (${tx.suggestedBroadCategory})` : ''}`
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <select
                      value={tx.userOverrideCategory || tx.specificCategory}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary placeholder-placeholderText"
                      aria-label={`Override category for transaction on ${tx.date} for ${tx.description}`}
                    >
                      {!filteredCoaOptions.find(opt => opt.specificName === (tx.userOverrideCategory || tx.specificCategory)) &&
                        (tx.userOverrideCategory || tx.specificCategory) &&
                        <option key={tx.userOverrideCategory || tx.specificCategory} value={tx.userOverrideCategory || tx.specificCategory}>
                          {tx.userOverrideCategory || tx.specificCategory}
                        </option>
                      }
                      {filteredCoaOptions.map(opt => (
                        <option key={opt.specificName} value={opt.specificName} className={`${opt.isSubCategory ? 'pl-4 text-textSecondary' : 'font-semibold text-textPrimary'} bg-slate-700 hover:bg-slate-600`}>
                          {opt.specificName} ({opt.broadCategory})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {transactions.length > 0 && (
        <div className="p-4 border-t border-borderNeutral flex justify-end">
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 ease-in-out text-sm"
          >
            Export to Excel (XLSX)
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;