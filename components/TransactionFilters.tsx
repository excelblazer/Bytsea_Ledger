import React from 'react';
import { AccountingCategory, PredictionSourceType } from '../types';

interface SearchFilters {
  searchText: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  categoryFilter: string;
  predictionSourceFilter: string;
  confidenceMin: number;
  showOnlyUnreviewed: boolean;
}

interface TransactionFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  specificCoaOptions: { specificName: string, broadCategory: AccountingCategory, isSubCategory: boolean }[];
  getUniquePredictionSources: () => string[];
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  specificCoaOptions,
  getUniquePredictionSources
}) => {
  const handleFilterChange = (key: keyof SearchFilters, value: string | number | boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="border-b border-borderNeutral">
      {/* Filter Toggle */}
      <div className="p-4">
        <button
          onClick={onToggleFilters}
          className="flex items-center space-x-2 text-textSecondary hover:text-textPrimary transition-colors duration-150"
        >
          <span className="text-sm font-medium">Advanced Filters</span>
          <svg
            className={`w-4 h-4 transition-transform duration-150 ${showFilters ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-textSecondary mb-1">Category</label>
              <select
                value={filters.categoryFilter}
                onChange={(e) => handleFilterChange('categoryFilter', e.target.value)}
                className="w-full px-2 py-1 bg-slate-600 border border-borderNeutral rounded text-textPrimary focus:ring-primary focus:border-primary text-sm"
              >
                <option value="">All Categories</option>
                {specificCoaOptions.map(opt => (
                  <option key={opt.specificName} value={opt.specificName}>
                    {opt.specificName} ({opt.broadCategory})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-textSecondary mb-1">Prediction Source</label>
              <select
                value={filters.predictionSourceFilter}
                onChange={(e) => handleFilterChange('predictionSourceFilter', e.target.value)}
                className="w-full px-2 py-1 bg-slate-600 border border-borderNeutral rounded text-textPrimary focus:ring-primary focus:border-primary text-sm"
              >
                <option value="">All Sources</option>
                {getUniquePredictionSources().map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-textSecondary mb-1">Min Confidence</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.confidenceMin}
                onChange={(e) => handleFilterChange('confidenceMin', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-textSecondary mt-1">{(filters.confidenceMin * 100).toFixed(0)}%</div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showOnlyUnreviewed}
                  onChange={(e) => handleFilterChange('showOnlyUnreviewed', e.target.checked)}
                  className="rounded border-borderNeutral text-primary focus:ring-primary focus:ring-2 bg-slate-600"
                />
                <span className="text-sm text-textSecondary">Unreviewed only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="p-4 bg-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase mb-1">Search</label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
              className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
              placeholder="Search by description, vendor, or customer"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase mb-1">Amount Range</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={filters.amountMin}
                onChange={(e) => onFiltersChange({ ...filters, amountMin: e.target.value })}
                className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
                placeholder="Min amount"
              />
              <input
                type="number"
                value={filters.amountMax}
                onChange={(e) => onFiltersChange({ ...filters, amountMax: e.target.value })}
                className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
                placeholder="Max amount"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase mb-1">Category</label>
            <select
              value={filters.categoryFilter}
              onChange={(e) => onFiltersChange({ ...filters, categoryFilter: e.target.value })}
              className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
            >
              <option value="">All categories</option>
              {specificCoaOptions.map(opt => (
                <option key={opt.specificName} value={opt.specificName}>
                  {opt.specificName} ({opt.broadCategory})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase mb-1">Prediction Source</label>
            <select
              value={filters.predictionSourceFilter}
              onChange={(e) => onFiltersChange({ ...filters, predictionSourceFilter: e.target.value })}
              className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
            >
              <option value="">All sources</option>
              {Object.values(PredictionSourceType).map(source => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-textSecondary uppercase mb-1">Confidence Score (min)</label>
            <input
              type="number"
              value={filters.confidenceMin}
              onChange={(e) => onFiltersChange({ ...filters, confidenceMin: parseFloat(e.target.value) })}
              className="block w-full p-2 border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-slate-700 text-textPrimary"
              placeholder="Min confidence score"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => onFiltersChange({ ...filters, showOnlyUnreviewed: !filters.showOnlyUnreviewed })}
              className={`px-4 py-2 rounded-lg shadow-md transition-colors duration-150 ease-in-out text-sm ${filters.showOnlyUnreviewed ? 'bg-primary text-white' : 'bg-slate-600 text-textPrimary'}`}
            >
              {filters.showOnlyUnreviewed ? 'Show All' : 'Show Only Unreviewed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
export type { SearchFilters };