import React from 'react';

interface TransactionTableHeaderProps {
  allSelected: boolean;
  totalTransactions: number;
  onSelectAll: (selected: boolean) => void;
}

const TransactionTableHeader: React.FC<TransactionTableHeaderProps> = ({
  allSelected,
  totalTransactions,
  onSelectAll
}) => {
  return (
    <thead className="bg-slate-700">
      <tr>
        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
          <input
            type="checkbox"
            checked={allSelected && totalTransactions > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-borderNeutral text-primary focus:ring-primary focus:ring-2 bg-slate-600"
          />
        </th>
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
  );
};

export default TransactionTableHeader;