import React, { useState, useEffect } from 'react';
import { EntityType } from '../types';

interface AddEntityModalProps {
  entityType: EntityType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingNames?: string[];
}

const AddEntityModal: React.FC<AddEntityModalProps> = ({ entityType, isOpen, onClose, onSave, existingNames = [] }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (existingNames.map(n => n.toLowerCase()).includes(name.trim().toLowerCase())) {
        setError(`A ${entityType} with this name already exists.`);
        return;
    }
    onSave(name.trim());
  };

  if (!isOpen) return null;

  const entityTypeLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="bg-surface p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-textPrimary">Add New {entityTypeLabel}</h2>
          <button onClick={onClose} className="text-textSecondary hover:text-textPrimary text-2xl transition-colors">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="entityName" className="block text-sm font-medium text-textSecondary">{entityTypeLabel} Name</label>
            <input
              type="text"
              id="entityName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-borderNeutral rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-textPrimary sm:text-sm placeholder-placeholderText"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
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
            Save {entityTypeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEntityModal;