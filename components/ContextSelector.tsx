import React from 'react';
import { Client, Book, Industry, EntityType } from '../types';

interface ContextSelectorProps {
  clients: Client[];
  books: Book[];
  industries: Industry[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  selectedBook: Book | null;
  setSelectedBook: (book: Book | null) => void;
  selectedIndustry: Industry | null;
  setSelectedIndustry: (industry: Industry | null) => void;
  isTrainingData: boolean;
  setIsTrainingData: (isTraining: boolean) => void;
  onAddNew: (entityType: EntityType) => void;
  disabled?: boolean;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({
  clients, books, industries,
  selectedClient, setSelectedClient,
  selectedBook, setSelectedBook,
  selectedIndustry, setSelectedIndustry,
  isTrainingData, setIsTrainingData,
  onAddNew,
  disabled
}) => {
  const availableBooks = selectedClient ? books.filter(b => b.clientId === selectedClient.id) : [];

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId) || null;
    setSelectedClient(client);
    setSelectedBook(null); // Reset book when client changes
  };

  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bookId = e.target.value;
    setSelectedBook(availableBooks.find(b => b.id === bookId) || null);
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const industryId = e.target.value;
    setSelectedIndustry(industries.find(i => i.id === industryId) || null);
  };

  const commonSelectClasses = "block w-full mt-1 p-2.5 bg-slate-700 border border-borderNeutral rounded-md shadow-sm focus:ring-primary focus:border-primary text-textPrimary sm:text-sm disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-textSecondary placeholder-placeholderText";
  const addButtonClasses = "ml-2 px-3 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-md shadow-sm disabled:opacity-50 transition-colors";
  const labelClasses = "block text-sm font-medium text-textSecondary";

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-70' : ''}`}>
      <div>
        <label htmlFor="client" className={labelClasses}>Client*</label>
        <div className="flex items-center mt-1">
          <select id="client" value={selectedClient?.id || ''} onChange={handleClientChange} className={commonSelectClasses} disabled={disabled}>
            <option value="" disabled={clients.length > 0}>Select Client</option>
            {clients.length === 0 && <option value="" disabled>No clients available. Add one!</option>}
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <button onClick={() => onAddNew('client')} className={addButtonClasses} disabled={disabled} title="Add New Client">+</button>
        </div>
      </div>

      <div>
        <label htmlFor="book" className={labelClasses}>Book*</label>
        <div className="flex items-center mt-1">
          <select id="book" value={selectedBook?.id || ''} onChange={handleBookChange} className={commonSelectClasses} disabled={!selectedClient || disabled || availableBooks.length === 0}>
            <option value="" disabled={availableBooks.length > 0}>Select Book</option>
            {availableBooks.length === 0 && selectedClient && <option value="" disabled>No books for this client. Add one!</option>}
            {!selectedClient && <option value="" disabled>Select client first</option>}
            {availableBooks.map(book => (
              <option key={book.id} value={book.id}>{book.name}</option>
            ))}
          </select>
          <button onClick={() => onAddNew('book')} className={addButtonClasses} disabled={!selectedClient || disabled} title="Add New Book">+</button>
        </div>
        {!selectedClient && <p className="mt-1 text-xs text-textSecondary opacity-75">Please select a client first to see or add books.</p>}
      </div>

      <div>
        <label htmlFor="industry" className={labelClasses}>Industry (Optional)</label>
        <div className="flex items-center mt-1">
          <select id="industry" value={selectedIndustry?.id || ''} onChange={handleIndustryChange} className={commonSelectClasses} disabled={disabled}>
            <option value="">Select Industry (Optional)</option>
            {industries.length === 0 && <option value="" disabled>No industries available. Add one!</option>}
            {industries.map(industry => (
              <option key={industry.id} value={industry.id}>{industry.name}</option>
            ))}
          </select>
          <button onClick={() => onAddNew('industry')} className={addButtonClasses} disabled={disabled} title="Add New Industry">+</button>
        </div>
      </div>

      <div className="flex items-center pt-2">
        <input
          id="training-data"
          type="checkbox"
          checked={isTrainingData}
          onChange={(e) => setIsTrainingData(e.target.checked)}
          className="h-4 w-4 text-primary bg-slate-700 border-borderNeutral rounded focus:ring-primary focus:ring-offset-surface disabled:opacity-50"
          disabled={disabled}
        />
        <label htmlFor="training-data" className="ml-3 block text-sm text-textSecondary">
          Designate as Training Data
        </label>
      </div>
    </div>
  );
};

export default ContextSelector;