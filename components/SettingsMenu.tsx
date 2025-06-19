import React from 'react';

interface SettingsMenuProps {
  onSelect: (option: 'export' | 'customize' | null) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onSelect }) => {
  return (
    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 z-50">
      <div className="py-1">
        <button
          className="w-full text-left px-4 py-2 text-sm text-textPrimary hover:bg-primary hover:text-white"
          onClick={() => onSelect('export')}
        >
          Export Training Data & Rules
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-textPrimary hover:bg-primary hover:text-white"
          onClick={() => onSelect('customize')}
        >
          Customize Accounting Rules
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
