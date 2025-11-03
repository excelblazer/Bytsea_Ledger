import React from 'react';
import { Transaction, AccountingCategory } from '../types';
import { normalizeCategoryFromString, getRuleFiles } from '../services/accountingRulesService';
import StatusBadge from './StatusBadge';
import { PredictionSourceType } from '../types';

interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onCategoryChange: (id: string, category: string) => void;
  specificCoaOptions: { specificName: string, broadCategory: AccountingCategory, isSubCategory: boolean }[];
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction: tx,
  isSelected,
  onSelect,
  onCategoryChange,
  specificCoaOptions
}) => {
  // Determine the broad category for this transaction's specificCategory
  const rules = getRuleFiles();
  const { broadCategory: txBroadCategory } = normalizeCategoryFromString(tx.specificCategory, rules);
  // Filter options to only those matching the broad category
  const filteredCoaOptions = specificCoaOptions.filter(opt => opt.broadCategory === txBroadCategory);

  return (
    <tr className="hover:bg-slate-700 transition-colors duration-150">
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(tx.id, e.target.checked)}
          className="rounded border-borderNeutral text-primary focus:ring-primary focus:ring-2 bg-slate-600"
        />
      </td>
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
          onChange={(e) => onCategoryChange(tx.id, e.target.value)}
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
};

export default TransactionRow;